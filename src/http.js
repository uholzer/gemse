/* Functions helping with XMLHttpRequests */

/**
 * Create a new XMLHttpRequest and open it.
 *
 * @param method {String} The HTTP method to use.
 * @param uri {String} Target of the request.
 * @param headers {[String, String]} A list of name-value pairs describing the
 *                                   headers to add.
 */
export function open(method, uri, headers=[]) {
    const request = new XMLHttpRequest();
    request.open(method, uri);
    headers.forEach(
        ([name, value]) => { request.setRquestHeader(name, value) }
    );
    return request;
}

/**
 * Send an XMLHttpRequest and return a promise
 *
 * The promise is resolved with the XMLHttpRequest itself when the request has
 * finished successfully. When the request fails, that is, no response is
 * obtained from the server for some reason, the promise is rejected with an
 * instance of Error.
 */
export function send(request, body) {
    return new Promise(function (resolve, reject) {
        request.addEventListener("load", load);
        request.addEventListener("error", error);
        request.addEventListener("abort", abort);
        request.addEventListener("timeout", timeout);
        request.send(body);

        function load() {
            resolve(request);
        }

        function error() {
            reject(new Error("HTTP request failed."));
        }

        function abort() {
            reject(new Error("HTTP request was aborted."));
        }

        function timeout() {
            reject(new Error("HTTP request timed out."));
        }
    });
}

/**
 * Return resolved promise for requests with status in the 2xx range atus and a
 * rejected one otherwise.
 */
export function only2xx(request) {
    if (request.status === 200) {
        return  Promise.resolve(request);
    }
    else {
        return Promise.reject(new Error(`Request resultet in ${request.status} instead of 200.`));
    }
}
