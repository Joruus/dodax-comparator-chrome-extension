fx.base = "EUR";
fx.rates = {
	"EUR" : 1, 
	"GBP" : 0.848425,
	"PLN" : 4.29654,
	"CHF" : 0.936604
}

let ratesAPI = 'https://api.ratesapi.io/api/latest?base=EUR&symbols=';

let dodaxVersions = { 'versions': [
    {   'extension': 'es',
        'currency': 'EUR'
    }, {
        'extension': 'co.uk',
        'currency': 'GBP'
    }, {
        'extension': 'fr',
        'currency': 'EUR'
    }, {
        'extension': 'de',
        'currency': 'EUR'
    }, {
        'extension': 'it',
        'currency': 'EUR'
    }, {
        'extension': 'at',
        'currency': 'EUR'
    }, {
        'extension': 'nl',
        'currency': 'EUR'
    }, {
        'extension': 'ch',
        'currency': 'CHF'
    }, {
        'extension': 'pl',
        'currency': 'PLN'
    }
]};

chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
    let url = tabs[0].url;
    let urlsplit = url.split('/');
    let currentExtension = urlsplit[2].replace('www.dodax.', '');
    let promises = [];

    //Update rates
    updateRates();

    dodaxVersions.versions.forEach(version => {
        promises.push(getURLPrice(url.replace('.' + currentExtension + '/', '.' + version.extension + '/'), version));
    });

    Promise.all(promises).then(values => {
        let links = Array.prototype.slice.call(document.getElementsByTagName('a'));
        links.forEach(link => {
            link.onclick = function() {
                chrome.tabs.create({url: link.getAttribute('href')});
            };
        });

        let smallPrice = 0;

        let versions = Array.prototype.slice.call(document.getElementsByClassName('version'));
        versions.forEach(v => {
            let price = parseFloat(v.getAttribute("price"));
            if (smallPrice == 0 || price < smallPrice) {
                smallPrice = price;

                let smallVersions = Array.prototype.slice.call(document.getElementsByClassName('small'));
                smallVersions.forEach(sv => { sv.classList.remove('small') });

                v.classList.add('small');
            } else if (price == smallPrice) {
                v.classList.add('small');
            }
        });
    });
});

function getURLPrice(url, version) {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.responseType = 'document';
        xhr.open("GET", url, true);
        xhr.onload = function() {
            let tags = Array.prototype.slice.call(xhr.response.getElementsByTagName('span'));
            tags.forEach(tag => {
                if (tag.getAttribute('class') && tag.getAttribute('class').includes('current_price')) { 
                    let currentPrice = tag.innerHTML.trim().replace(/[^0-9\.,]+/g, '').replace(',', '.');
                    let priceRate = window.fx(currentPrice).from(version.currency).to("EUR").toFixed(2)
                    
                    document.getElementById('price').innerHTML += '' +
                        '<li class="version" price="' + priceRate + '">' +
                            '<div><a id="link" href="' + url + '">dodax.' + version.extension + '</a></div>' +
                            '<div>' + tag.innerHTML + '</div>' +
                            '<div id="finalPrice">' + priceRate + ' &euro;</div>' +
                        '</li>';

                    resolve(xhr);
                }
            });
            resolve(xhr);
        }
        xhr.send();
    });   
}

function updateRates() {
    for (let rate in fx.rates) {
        if (rate !== 'EUR') {
            try {
                var xhr = new XMLHttpRequest();
                xhr.open("GET", ratesAPI + rate, false);
                xhr.onload = function() {
                    let response = JSON.parse(xhr.responseText);
                    fx.rates[rate] = response.rates[rate];
                }
                xhr.onerror = function() {
                    console.log(xhr.responseText);
                }
                xhr.send();
            } catch(e) {
                console.log(e)
            }
        }
    };
}