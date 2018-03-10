const fs = require('fs')
const config = require('./config')
const TwoCap = require('./twocap')
const Anti = require('./anti')
const log = require('./log')('log.log')
const emitter = require('./emitter')
const proxyInput = fs.readFileSync('proxies.txt').toString().split('\n')
const proxyList = require('./proxy').list(proxyInput)
var socket_host;
if (config.dev) {
  socket_host = 'http://localhost:8080'
} else {
  socket_host = 'https://two.disolve.io'
}
const socket = require('socket.io-client')(socket_host, {
  query: {
    token: config.apiKey
  }
})
socket.on('connect', function () {
  log.info('connected to DiSolve')
})
socket.on('disconnect', function () {
  log.error('disconnect from DiSolve')
})

function sendResponse(response) {
  var captcha = {
    key: response,
    host: config.host,
    sitekey: config.sitekey,
    apiKey: config.apiKey
  }
  socket.emit('solve', captcha)
  log.info('sent captcha response to DiSolve')
}
config.twocaptcha.keys.forEach(function (key) {
  log.info(`running 2captcha key ${key} with ${config.twocaptcha.tasks} tasks`)
  let worker = new TwoCap(key, config.twocaptcha.tasks, config.sitekey, config.host, proxyList)
  for (var i = 0; i < worker.tasks; i++) {
    worker.capID()
  }
})
config.anticaptcha.keys.forEach(function (key) {
  log.info(`running anti captcha key ${key} with ${config.anticaptcha.tasks} tasks`)
  let worker = new Anti(key, config.anticaptcha.tasks, config.sitekey, config.host, proxyList)
  for (var i = 0; i < worker.tasks; i++) {
    worker.capID()
  }
})

emitter.on('twocapSolved', (data) => {
  let { worker, response } = data
  sendResponse(response)
  worker.capID()
})
emitter.on('antiSolved', (data) => {
  let { worker, response } = data
  sendResponse(response)
  worker.capID()
})
