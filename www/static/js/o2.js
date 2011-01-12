RIA = {
    Class : {}
};
RIA.Class.O2app = function() {
    this.server      = 'data/';
    this.phones      = 'PayAndGoPhones.xml';
    this.accessories = 'AccessoryFeed.xml';
    this.data        = {};
    this.init = function() {
        var RIA = this;
        $('div[data-role="page"]').bind('pagehide',function(event,ui) {
            var nextPage = ui.nextPage.attr('id');
            if (nextPage == 'phones')      RIA.loadPhones();
            if (nextPage == 'accessories') RIA.loadAccessories();
            if (nextPage == 'phone')       RIA.loadPhone();
            });
    };
    this.loadPhones = function(callback) {
        if (this.data.phones) return this.displayPhones();
        var RIA = this;
        $.get(this.server+this.phones,function(data) {
            RIA.data.phones = data;
            if (callback && typeof(callback) == 'function') callback();
            else RIA.displayPhones();
        },'xml');
    };
    this.loadAccessories = function() {
        if (this.data.accessories) return this.displayAccessories();
        var RIA = this;
        $.get(this.server+this.accessories,function(data) {
            RIA.data.accessories = data;
            RIA.displayAccessories();
        },'xml');
    };
    this.loadPhone = function() {
        if (!this.data.phones) this.loadPhones(this.displayPhone);
        else this.displayPhone();
    };
    this.displayPhones = function() {
        $(this.data.phones).find('Phone').each(function() {
            console.log($(this).find('manufacturer'),$(this).find('name'));
        });
    };
    this.filterPhones = function() {
        console.log('filter phones');
    };
    this.displayPhone = function() {
        console.log('display phone');
    };
    this.displayAccessories = function() {
        console.log('display accessories');
    };
    this.init();
}
RIA.O2app = new RIA.Class.O2app();
