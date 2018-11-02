module.exports = {

    getAuthHeader() {

        var authHash = localStorage.getItem('token');
        return 'Basic ' + authHash;
    },

    performRequest(url, shouldGetAuth, method, body, auth = false, file = false) {

        let proto = window.location.protocol;

        var headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        if (file) {
            delete headers['Content-Type'];
        }

        if (shouldGetAuth) {
            var authHash = localStorage.getItem('hash');
            headers['Authorization'] = 'Basic ' + authHash;
        }

        if (auth) {
            headers['Authorization'] = 'Basic ' + auth;
        }

        var request = {
            method: method,
            headers: headers
        };

        if (body && !file) {
            request['body'] = JSON.stringify(body);
        } else if (file) {
            let formData = new FormData();
            formData.append('image', file.item(0));
            request['body'] = formData;
        }

        return fetch(proto + "//" + process.env.API_URL + url, request)
            .then(function(response) {
                if (response.status >= 200 && response.status < 300) {
                    return Promise.resolve(response)
                } else {
                    return Promise.reject(new Error(response.statusText))
                }
            })
            .then(response => response.json());
    },

    performImageUrl(file) {
        let proto = window.location.protocol;

        var authHash = localStorage.getItem('hash');
        var headers = {
            'Accept': 'application/json',
            'Authorization': 'Basic ' + authHash
        };

        var request = {
            method: 'Post',
            headers: headers
        };

        if (file) {
            let formData = new FormData();
            formData.append('image', file);
            request['body'] = formData;
        }

        return fetch(proto + "//" + process.env.API_URL + "/upload?article=1", request)
            .then(function(response) {
                if (response.status >= 200 && response.status < 300) {
                    return Promise.resolve(response)
                } else {
                    return Promise.reject(new Error(response.statusText))
                }
            })
            .then(response => response.json());
    }
};