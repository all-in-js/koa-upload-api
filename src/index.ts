import Koa from 'koa';
import fs from 'fs-extra';
import { Fields, File, Files, IncomingForm } from 'formidable';

export interface UploadedResult {
  error: any;
  files: Files;
  fields: Fields;
  invalidParams?: boolean;
}
export interface UploadApiOptions<Ctx> {
  uri?: string;
  encoding?: string;
  uploadDir?: string;
  keepExtensions?: boolean;
  allowEmptyFiles?: boolean;
  minFileSize?: number;
  maxFileSize?: number;
  maxFields?: number;
  maxFieldsSize?: number;
  hash?: string | false;
  validator?: (cx: Ctx) => Promise<boolean>; // 通过true，不通过false
  response?: (cx: Ctx, result: UploadedResult) => any;
  fileWriteStreamHandler?: () => void;
  multiples?: boolean;
  captureRejections?: boolean;
  [key: string]: any;
}
function uploadApi<Ctx>(options: UploadApiOptions<Ctx>) {
  const {
    uri,
    response,
    validator,
    ...formidableOption
  } = options;
  const reqUri = uri || '/api/upload';
  const uploader = new IncomingForm(formidableOption);
  return async function middleware(cx: Koa.Context & Ctx, next: Koa.Next) {
    if (cx.path === reqUri) {
      const {
        invalidParams,
        ...result
      }: UploadedResult = await (new Promise((rs) => {
        uploader.parse(cx.req, async function(err: any, fields: Fields, files: Files) {
          /**
           * 1. 使用koa-bodyparser时，formdata里的fields不会解析到request.body上
           * 2. 使用koa-body时，内部是调用formidable来解析的fields，然后将其挂载到request.body上
           * 3. 使用koa-upload-api时，还是推荐使用koa-bodyparser，因为，koa-body虽然解析了formdata，
           *    但是，当参数校验不通过时，携带的文件不会被删除，造成临时目录存在多余的文件积压
           * 4. 当参数校验不通过时，此处会将临时目录的文件删掉，防止文件积压
           */
          (cx.request as any).body = fields;
          (cx.request as any).files = files;
          if (validator) {
            const access = await validator.call(cx, cx);
            if (!access) {
              if (files) {
                /**
                 * 验证不通过时删掉已上传的文件
                 */
                Object.keys(files).forEach((fileKey) => {
                  fs.remove((files[fileKey] as File).path);
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
      } else {
        await response.call(cx, cx, result);
      }
    } else {
      await next();
    }
  }
}

export default uploadApi;

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