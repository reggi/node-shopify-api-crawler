var url = require("url")
var Promise = require("bluebird")
var cheerio = require("cheerio")
var request = require("request-promise")

request("https://docs.shopify.com/api")
  .then(function(html){
    var $ = cheerio.load(html)
    var endpoints = $(".sidebar-api").children().last().find("ul li").map(function(i, el) {
      return {
        href: $(this).find("a").attr("href"),
        text: $(this).text()
      };
    }).get()
    return Promise.map(endpoints, function(endpoint){
      return request("https://docs.shopify.com"+ endpoint.href)
        .then(function(html){
          var $ = cheerio.load(html)
          endpoint.list = $(".api-endpointlist li")
            .map(function(i, el) {
              var full = $(this).find(".api-endpointlist-request-type").text()
              var methodEndpointSplit = full.split(' ')
              var method = methodEndpointSplit[0]
              var endpoint = methodEndpointSplit[1].replace(/\#\{id\}/g, 'id')
              endpoint = url.parse(endpoint)
              return {
                request: full,
                method: method,
                endpoint: endpoint.pathname.replace(/id/g, '#{id}'),
                description: $(this).find(".api-endpointlist-description").text()
              };
            }).get()
          return endpoint
      })
    })
  })
  .then(function(shopifyApi){
    console.log(JSON.stringify(shopifyApi, null, 2))
  })
