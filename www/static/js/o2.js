window.o2 = {
    data    : {},
    screens : [
        {id:'loader',el:document.getElementById('loader')},
        {id:'phones'},
        {id:'phone'},
        {id:'accessories'},
        {id:'accessory'}
    ],
    feeds   : {
        server      : 'http://www.nonleag.eu/data/',
        phones      : 'phones-payandgo.json',
        accessories : 'accessories.json'
    },
    loadPhones : function(data) {
        o2.data.phones = data;
    },
    loadAccessories : function(data) {
        o2.data.accessores = data;
    },
    Application : function() {
        this.state = 0;
        this.init = function() {
            this.loadFeeds();
        };
        this.loadFeeds = function() {
            $.loadJS(o2.feeds.server+o2.feeds.phones+'?callback=o2.loadPhones');
            $.loadJS(o2.feeds.server+o2.feeds.accessories+'?callback=o2.loadAccessories');
        };
        this.init();
    }
};
(function() {
    02.app = new o2.Application();
})();
