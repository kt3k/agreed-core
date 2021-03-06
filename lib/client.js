'use strict';

const http = require('http');
const https = require('https');
const path = require('path');
const url = require('url');
const Checker = require('./check/checker');
const CheckBodyStream = require('./check/CheckBodyStream');
const completion = require('./check/completion');
const extract = require('./check/extract');
const isContentJSON = require('./check/isContentJSON');
const register = require('./register');
const format = require('./template/format');
const requireUncached = require('./require_hook/requireUncached');

class Client {
  constructor(options) {
    this.agreesPath = path.resolve(options.path);
    this.base = path.dirname(this.agreesPath);
    this.scheme = options.scheme || 'http';
    this.host = options.host || 'localhost';
    this.port = options.port || 80;
    register();
  }

  getAgreement() {
    return requireUncached(this.agreesPath);
  }

  executeAgreement(agrees) {
    agrees = agrees.map((agree) => completion(agree, this.base));
    const resultsPromise = agrees.map((agree) => {
      const options = extract.outgoingRequest(agree.request, this);
      const hasContentJSON = isContentJSON(agree.request);
      const content = hasContentJSON ? JSON.stringify(format(agree.request.body, agree.request.values)) : agree.request.body;
      const contentLength = content ? Buffer.byteLength(content) : 0;
      options.headers['Content-Length'] = contentLength;
      options.headers['Content-Type'] = (agree.request.headers && agree.request.headers['Content-Type']) || 'application/json';
      const protocol = this.scheme === 'http' ? http : https;


      if (agree.response.body) {
        agree.response.body = format(agree.response.body, agree.request.values);
      }
      return new Promise((resolve, reject) => {
        const req = protocol.request(options, resolve);
        req.on('error', reject);
        content && req.write(content);
        req.end();
      });

    });
    return resultsPromise;
  }

  checkResponse(promises, agrees) {
    return Promise.all(promises).then((responses) => {
      return new Promise((resolve, reject) => {
        const results = [];
        var finishCount = 0;
        responses.forEach((res, i) => {
          const isSameStatus = Checker.status(agrees[i].response.status, res.statusCode);
          const checkStream = new CheckBodyStream();
          checkStream.expect(agrees[i].response.body);
          res.pipe(checkStream).on('checked', (result) => {
            finishCount++;
            if (!isSameStatus) {
              result.status = [agrees[i].response.status, res.statusCode];
            }
            results[i] = result;
            if (finishCount === responses.length) {
              resolve(results);
            }
          });
        });
      });
    });
  }
}

module.exports = Client;
