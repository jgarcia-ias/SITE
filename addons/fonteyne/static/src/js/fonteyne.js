openerp.fonteyne = function(instance){
    var module = instance.point_of_sale;
    var QWeb = instance.web.qweb;
    var round_pr = instance.web.round_precision;

    QWeb.add_template('/fonteyne/static/src/xml/fonteyne.xml');

    module.PosWidget.include({
        build_widgets: function(){
            var self = this;
            this._super();
            
            if(!this.pos.loyalty){
                return;
            }

            var discount = $(QWeb.render('DiscountButton'));

            discount.click(function(){
                var order = self.pos.get('selectedOrder');
                var client = order.get('client');
                if( !client ){
                    self.screen_selector.set_current_screen('clientlist');
                }else if(client.loyalty_points < self.pos.loyalty.minimum_points){
                    self.screen_selector.show_popup('error',{
                        message: 'Cannot Apply Discount',
                        comment: 'The customer must have at least '+self.pos.loyalty.minimum_points.toFixed(0)+
                                 ' points to benefit from a loyalty discount.\n The customer currently has '+
                                  client.loyalty_points.toFixed(0)+' points',
                    });
                }else if( !self.pos.loyalty.discount_product_id || 
                          !self.pos.db.get_product_by_id(self.pos.loyalty.discount_product_id[0]) ){
                    self.screen_selector.show_popup('error',{
                        message: 'Configuration Error',
                        comment: 'Either there is no discount product set or it is not available for sale. Please contact your System Administrator',
                    });
                }else{
                    var product = self.pos.db.get_product_by_id(self.pos.loyalty.discount_product_id[0]);
                    var order_total  = order.getTotalTaxIncluded();
                    var point_value  = product.price / product.loyalty_points; 
                    var max_discount = client.loyalty_points * point_value; 
                    if ( max_discount > order_total ){ 
                        var points = Math.min(client.loyalty_points, round_pr(order_total / point_value, self.pos.loyalty.rounding));
                    }else{
                        var points = client.loyalty_points;
                    }
                    order.addProduct(product,{ quantity: Math.floor(points/Math.abs(product.loyalty_points)) });
                }
            });

            discount.appendTo(this.$('.control-buttons'));
            this.$('.control-buttons').removeClass('oe_hidden');
        },
    });
};

    
