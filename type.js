const rp = require('request-promise')
const log = require('./log')('anti.log')
const emitter = require('./emitter')
const proxy = require('./proxy')
const config = require('./config')
const notReady = 'CAPCHA_NOT_READY'
class Anti {
  constructor(key, tasks, sitekey, page, proxyList) {
    this.key = key
    this.tasks = tasks
    this.sitekey = sitekey
    this.page = page
    this.pageurl = `http://${this.page}`
    this.captchas = []
    this.proxyList = proxyList
    setInterval(this.check.bind(this), config.checkInterval)
  }
  capID() {
    log.debug('requesting captchaID from anti')
    rp({
        proxy: proxy.formatProxy(this.proxyList[Math.floor(Math.random() * this.proxyList.length)]),
        url: 'https://api.anti-captcha.com/createTask',
        method: 'POST',
        json: true,
        body: {
          "clientKey": this.key,
          "task": {
            "type": "NoCaptchaTaskProxyless",
            "websiteURL": this.pageurl,
            "websiteKey": this.sitekey
          }
        },
      })
      .then((res) => {
        let taskID = res.taskId
        if (!taskID) return setTimeout(this.capID.bind(this), config.checkInterval)
        this.captchas.push(taskID)
      })
      .catch((e) => {
        log.error(e)
        setTimeout(this.capID.bind(this), config.checkInterval)
      })
  }
  check() {
    log.verbose(`checking anti captcha ids ${this.captchas}`)
    this.captchas.forEach((captchaID, index) => {
      rp({
          proxy: proxy.formatProxy(this.proxyList[Math.floor(Math.random() * this.proxyList.length)]),
          url: 'https://api.anti-captcha.com/getTaskResult',
          method: 'POST',
          json: true,
          body: {
            "clientKey": this.key,
            "taskId": captchaID
          }
        })
        .then((res) => {
          let solution = res.solution
          if (!solution) return
          let response = solution.gRecaptchaResponse
          emitter.emit('antiSolved', { worker: this, response: response })
          this.captchas.splice(index, 1)
        })
        .catch(log.error)
    })
  }
}
module.exports = Anti