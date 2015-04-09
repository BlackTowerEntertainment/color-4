import Ember from 'ember';

export default Ember.Controller.extend({
  websocket: Ember.inject.service(),

  subscribe: function() {
    var controller = this;
    let socket = controller.get('websocket.socket');

    socket.on('update host', (host) => {
    });
  },

  unsubscribe: function() {
    let socket = this.get('websocket.socket');
    socket.removeAllListeners();
  }
});
