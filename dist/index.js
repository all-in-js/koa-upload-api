"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const formidable_1 = require("formidable");
function uploadApi(options) {
    const { uri, response, ...formidableOption } = options;
    const reqUri = uri || '/api/upload';
    const uploader = new formidable_1.IncomingForm(formidableOption);
    return async function middleware(cx, next) {
        if (cx.path === reqUri) {
            const result = await (new Promise((rs) => {
                uploader.parse(cx.req, function (err, fields, files) {
                    rs({
                        error: err,
                        files,
                        fields
                    });
                });
            }));
            if (typeof response === 'function') {
                response.call(cx, cx, result);
            }
        }
        else {
            await next();
        }
    };
}
exports.default = uploadApi;
/**
 * app.use(uploadApi({
 *  uri: '/v1/upload',
 *  keepExtensions: true,
 *  ...formidable_option,
 *  response(cx, result) {
 *    if (result.err) {
 *      cx.body = result.err.message;
 *    } else {
 *      const file = result.files.fileKey;
 *      cx...
 *    }
 *  }
 * }));
 */ 
