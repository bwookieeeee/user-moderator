const WebSocket = require("ws");
const { key, url } = require("./config.json").remo;
const EventEmitter = require("events");

module.exports.ws = new WebSocket(url);
module.exports.remoevts = new EventEmitter;


this.ws.onopen = () => {
  // this.ws.login();
  console.log("ws open");
  this.remoevts.emit("ready");
};

module.exports.ws.login = () => {
  this.ws.send(JSON.stringify({
    e: "INTERNAL_LISTENER_AUTHENTICATE",
    d: {
      key: key
    }
  }));
  console.log("ws authenticated");
};

this.ws.onmessage = async evt => {
  const data = JSON.parse(evt.data);
  if (data.e === "userAuthenticated") {
    this.remoevts.emit("NEW_LOGIN", await handleLoginEvent(data.d));
  }
};

const handleLoginEvent = async data => {
  const axios = require("axios");
  const { ipApiKey } = require("./config.json").misc;
  let isp, countryCode, proxy;
  const args = JSON.parse(Buffer.from(data.alt, "base64").toString());

  const { hardwareConcurrency, renderer, userAgent, width, height } = args;
  const { username, ip, internalUsernameBanned, internalIpBanned } = data;
  console.log(`New login: ${username} @ ${ip}`);
  const res = await axios.get(`https://ipqualityscore.com/api/json/ip/${ipApiKey}/${ip}`);
  if (res.data.success) {
    isp = res.data.ISP;
    countryCode = res.data.country_code;
    if (res.data.active_vpn || res.data.active_tor) {
      proxy = "**Proxy detected: ";
      if (res.data.active_vpn) proxy += "VPN**";
      if (res.data.active_tor) proxy += "TOR**";
    }
    else {
      proxy = "No proxy detected";
    }
  }
  else {
    console.error(res.data.message);
    isp = countryCode = proxy = "Error occurred while polling external API";
  }

  return {
    username,
    cores: hardwareConcurrency,
    gpu: renderer,
    userAgent,
    ip,
    countryCode,
    isp,
    proxy,
    usernameBanned: internalUsernameBanned,
    ipBanned: internalIpBanned,
    width: width,
    height: height,
    time: Date.now()
  };
};