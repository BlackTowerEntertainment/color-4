/* global io */

import Ember from 'ember';

export default Ember.Service.extend({
  _setup: function() {
    let socket = this.socket = io(`${window.location.hostname}:8080`);
  }.on('init'),

  send: function(message) {
    this.socket.emit('message', message);
  }

});
