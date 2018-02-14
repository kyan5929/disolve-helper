const EventEmitter = require('events')
class appEmitter extends EventEmitter {}
emitter = new appEmitter()
emitter.on('error', (err, src) => {
  console.log(err.toString())
})
module.exports = emitter
