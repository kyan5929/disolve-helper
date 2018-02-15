const rp = require('request-promise')
const log = require('./log')('twocap.log')
const emitter = require('./emitter')
const proxy = require('./proxy')
const config = require('./config')
const notReady = 'CAPCHA_NOT_READY'
const host = '89.108.117.181'
class TwoCap {
  constructor(key, tasks, sitekey, page, proxyList) {
    this.key = key
    this.tasks = tasks
    this.sitekey = sitekey
    this.page = page
    this.captchas = []
    this.proxyList = proxyList
    setInterval(this.check.bind(this), config.checkInterval)
  }
  capID() {
    rp({
        proxy: proxy.formatProxy(this.proxyList[Math.floor(Math.random() * this.proxyList.length)]),
        url: `http://${host}/in.php`,
        headers: {
          Host: '2captcha.com'
        },
        method: 'POST',
        form: {
          key: this.key,
          method: 'userrecaptcha',
          googlekey: this.sitekey,
          pageurl: this.page
        }
      })
      .then((res) => {
        if (res.slice(0, 2) == 'OK') {
          this.captchas.push(res.split('|')[1])
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
    let ids = ''
    this.captchas.forEach((captchaID, index) => {
      let text = ''
      text += captchaID
      if (index != this.captchas.length - 1) {
        text += ','
      }
      ids += text
    })
    if (!ids) return
    log.verbose(`checking for recaptcha responses ${ids}`)
    rp({
        proxy: proxy.formatProxy(this.proxyList[Math.floor(Math.random() * this.proxyList.length)]),
        url: `http://${host}/res.php`,
        headers: {
          Host: '2captcha.com'
        },
        method: 'GET',
        qs: {
          key: this.key,
          action: 'get',
          ids: ids,
        }
      })
      .then((res) => {
        let responses = res.split('|')
        responses.forEach((response, index) => {
          if (response == notReady) return
          emitter.emit('twocapSolved', { worker: this, response: response })
          this.captchas.splice(index, 1)
        })
      })
      .catch(log.error)
  }

}

module.exports = TwoCap