"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const formidable_1 = require("formidable");
function uploadApi(options) {
    const { uri, response, validator, ...formidableOption } = options;
    const reqUri = uri || '/api/upload';
    const uploader = new formidable_1.IncomingForm(formidableOption);
    return async function middleware(cx, next) {
        if (cx.path === reqUri) {
            const { invalidParams, ...result } = await (new Promise((rs) => {
                uploader.parse(cx.req, async function (err, fields, files) {
                    /**
                     * 1. 使用koa-bodyparser时，formdata里的fields不会解析到request.body上
                     * 2. 使用koa-body时，内部是调用formidable来解析的fields，然后将其挂载到request.body上
                     * 3. 使用koa-upload-api时，还是推荐使用koa-bodyparser，因为，koa-body虽然解析了formdata，
                     *    但是，当参数校验不通过时，携带的文件不会被删除，造成临时目录存在多余的文件积压
                     * 4. 当参数校验不通过时，此处会将临时目录的文件删掉，防止文件积压
                     */
                    cx.request.body = fields;
                    cx.request.files = files;
                    if (validator) {
                        const access = await validator.call(cx, cx);
                        if (!access) {
                            if (files) {
                                /**
                                 * 验证不通过时删掉已上传的文件
                                 */
                                Object.keys(files).forEach((fileKey) => {
                                    fs_extra_1.default.remove(files[fileKey].path);
                                });
                            }
                            return rs({
                                error: null,
                                files: {},
                                fields: {},
                                invalidParams: true
                            });
                        }
                    }
                    rs({
                        error: err,
                        files,
                        fields,
                        invalidParams: false
                    });
                });
            }));
            if (invalidParams || typeof response !== 'function') {
                await next();
            }
            else {
                await response.call(cx, cx, result);
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
