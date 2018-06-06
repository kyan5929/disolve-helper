const fs = require('fs')
const config = require('./config')
const TwoCap = require('./twocap')
const Anti = require('./anti')
const Typer = require('./typer')
const log = require('./log')('log.log')
const emitter = require('./emitter')
const sticky = require('./sticky.js')
const proxyInput = fs.readFileSync('proxies.txt').toString().split('\n')
const proxyList = require('./proxy').list(proxyInput)
var socket_host;
if (config.dev) {
  socket_host = 'http://localhost:8080'
} else {
  socket_host = 'https://app.disolve.io'
}

let socket

async function init() {
  let cookie = await sticky(socket_host)

  socket = require('socket.io-client')(socket_host, {
    query: {
      token: config.apiKey
    },
    extraHeaders: {
      Cookie: cookie
    }
  })
  socket.on('connect', function () {
    log.info('connected to DiSolve')
	  config.sites.forEach((site) => {
		  start(site)
	  })
  })
  socket.on('disconnect', function () {
    log.error('disconnect from DiSolve')
  })
  socket.on('error', function (e) {
    log.error(e)
    log.error('could not connect to DiSolve, verify config.json file is correct')
  })
}

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

function start(site) {
	if (config.twocaptcha && config.twocaptcha.keys) {

	config.twocaptcha.keys.forEach(function (key) {
    log.info(`running 2captcha key ${key} on ${site.host} with ${config.twocaptcha.tasks} tasks`)
    let worker = new TwoCap(key, config.twocaptcha.tasks, site.sitekey, site.host, proxyList)
    for (var i = 0; i < worker.tasks; i++) {
      worker.capID()
    }
  })
	}

	if (config.anticaptcha && config.anticaptcha.keys) {
  config.anticaptcha.keys.forEach(function (key) {
    log.info(`running anti captcha key ${key} on ${site.host} with ${config.anticaptcha.tasks} tasks`)
    let worker = new Anti(key, config.anticaptcha.tasks, site.sitekey, site.host, proxyList)
    for (var i = 0; i < worker.tasks; i++) {
      worker.capID()
    }
  })
	}
	if (config.imagetyperz && config.imagetyperz.keys) {
  config.imagetyperz.keys.forEach(function (key) {
    log.info(`running imagetyperz key ${key} on ${site.host} with ${config.imagetyperz.tasks} tasks`)
    let worker = new Typer(key, config.imagetyperz.tasks, site.sitekey, site.host, proxyList)
    for (var i = 0; i < worker.tasks; i++) {
      worker.capID()
    }
  })
	}

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
emitter.on('typerSolved', (data) => {
  let { worker, response } = data
  sendResponse(response)
  worker.capID()
})
}
init()
