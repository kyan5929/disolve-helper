const rp = require('request-promise')
const log = require('./log')('typer.log')
const emitter = require('./emitter')
const proxy = require('./proxy')
const config = require('./config')
const baseURL = 'http://captchatypers.com'
class Typer {
  constructor(key, tasks, site, proxyList) {
    this.key = key
    this.tasks = tasks
    this.site = site
    this.sitekey = site.sitekey
    this.page = site.host
    this.captchas = []
    this.proxyList = proxyList
    setInterval(this.check.bind(this), config.checkInterval)
  }
  capID() {
    log.debug('requesting captchaID from imagetyperz')
    rp({
        proxy: proxy.formatProxy(this.proxyList[Math.floor(Math.random() * this.proxyList.length)]),
        url: `${baseURL}/captchaapi/UploadRecaptchaToken.ashx`,
        method: 'POST',
        form: {
          token: this.key,
          action: 'UPLOADCAPTCHA',
          googlekey: this.sitekey,
          pageurl: this.page
        }
      })
      .then((res) => {
        if (res.length > 5) {
          this.captchas.push(res)
        } else {
          setTimeout(this.capID.bind(this), config.checkInterval)
        }

      })
      .catch((e) => {
        log.error(e)
        setTimeout(this.capID.bind(this), config.checkInterval)
      })
  }
  check() {
    log.verbose(`checking imagetyperz captcha ids ${this.captchas}`)
    this.captchas.forEach((captchaID, index) => {
      rp({
          proxy: proxy.formatProxy(this.proxyList[Math.floor(Math.random() * this.proxyList.length)]),
          url: `${baseURL}/captchaapi/GetRecaptchaTextToken.ashx`,
          method: 'POST',
          form: {
            "token": this.key,
            "captchaID": captchaID,
            "action": "GETTEXT"
          }
        })
        .then((res) => {
          if (res.indexOf('NOT_DECODED') != -1 || res.length < 50) return
          emitter.emit('typerSolved', { worker: this, response: res })
          this.captchas.splice(index, 1)
        })
        .catch(log.error)
    })
  }

}

module.exports = Typer
