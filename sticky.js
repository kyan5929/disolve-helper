const rp = require('request-promise')

module.exports = async function (url) {
  let jar = rp.jar()
  let opts = {
    url: url,
    jar: jar
  }
  await rp(opts)
  let cookieString = jar.getCookieString(url)
  return cookieString
}