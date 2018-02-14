exports.formatProxy = function (proxy) {
  if (proxy && ['localhost', ''].indexOf(proxy) < 0) {
    proxy = proxy.replace(' ', '_');
    const proxySplit = proxy.split(':');
    if (proxySplit.length > 3)
      return "http://" + proxySplit[2] + ":" + proxySplit[3] + "@" + proxySplit[0] + ":" + proxySplit[1];
    else
      return "http://" + proxySplit[0] + ":" + proxySplit[1];
  } else
    return undefined;
}

exports.list = function (proxyInput) {
  const proxyList = [];
  for (let p = 0; p < proxyInput.length; p++) {
    proxyInput[p] = proxyInput[p].replace('\r', '').replace('\n', '');
    if (proxyInput[p] != '')
      proxyList.push(proxyInput[p]);
  }
  return proxyList
}