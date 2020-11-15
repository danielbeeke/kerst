'use strict';

const https = require('https')
const settings = require('./settings.js')

const objectToQueryString = function (a) {
  var prefix, s, add, name, r20, output;
  s = [];
  r20 = /%20/g;
  add = function (key, value) {
    // If value is a function, invoke it and return its value
    value = ( typeof value == 'function' ) ? value() : ( value == null ? "" : value );
    s[ s.length ] = encodeURIComponent(key) + "=" + encodeURIComponent(value);
  };
  if (a instanceof Array) {
    for (name in a) {
      add(name, a[name]);
    }
  } else {
    for (prefix in a) {
      buildParams(prefix, a[ prefix ], add);
    }
  }
  output = s.join("&").replace(r20, "+");
  return output;
};
function buildParams(prefix, obj, add) {
  var name, i, l, rbracket;
  rbracket = /\[\]$/;
  if (obj instanceof Array) {
    for (i = 0, l = obj.length; i < l; i++) {
      if (rbracket.test(prefix)) {
        add(prefix, obj[i]);
      } else {
        buildParams(prefix + "[" + ( typeof obj[i] === "object" ? i : "" ) + "]", obj[i], add);
      }
    }
  } else if (typeof obj == "object") {
    // Serialize object item.
    for (name in obj) {
      buildParams(prefix + "[" + name + "]", obj[ name ], add);
    }
  } else {
    // Serialize scalar item.
    add(prefix, obj);
  }
}

const request = async (url, method = 'GET', formData, stripeApiKey) => {
  const [host, ...path] = url.split('://')[1].split('/')
  const postData = objectToQueryString(formData)

  const params = {
    method,
    host,
    port: 443,
    path: '/' + path.join('/'),
    headers: {
      'Authorization': 'Bearer ' + stripeApiKey,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': postData.length
    }
  }

  return new Promise((resolve, reject) => {
    const req = https.request(params, res => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`Status Code: ${res.statusCode}`))
      }

      const data = [];
      res.on('data', chunk => data.push(chunk))
      res.on('end', () => resolve(JSON.parse(Buffer.concat(data).toString())))
    });

    req.write(postData)
    req.on('error', reject)
    req.end()
  });
};

async function _createSession (body, stripeApiKey) {
  const session = await request('https://api.stripe.com/v1/checkout/sessions', 'POST', {
    payment_method_types: ['ideal'],
    mode: 'payment',
    locale: 'nl',
    line_items: body.lineItems,
    shipping_address_collection: {
      allowed_countries: ['NL']
    },
    success_url: body.origin.origin + '#success',
    cancel_url: body.origin.origin + '#cancel',
  }, stripeApiKey)

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      id: session.id
    }),
  }
}

async function testCreateSession () {
  const body = {
    origin: {
      origin: 'https://kerst.wilmavis.nl',
    },
    lineItems: [{"price":"price_1Hfr6pDM7H4MIyD8DzIEDkaA","quantity":2}]
  }

  const session = await _createSession(body, settings.testKey)
  console.log(session)
}


module.exports.createSession = async (event, context, callback) => {
  const env = event.requestContext ? event.requestContext.stage : 'test'
  const stripeApiKey = env === 'test' ? settings.testKey : settings.prodKey
  const body = JSON.parse(event.body)
  const response = await _createSession(body, stripeApiKey)
  callback(null, response)
};

// testCreateSession()
