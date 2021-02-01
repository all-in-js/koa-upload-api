import Koa from 'koa';
import { Fields, Files, IncomingForm } from 'formidable';

interface UploadedResult {
  error: any;
  files: Files;
  fields: Fields;
}
interface UploadApiOptions<Ctx> {
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
    ...formidableOption
  } = options;
  const reqUri = uri || '/api/upload';
  const uploader = new IncomingForm(formidableOption);
  return async function middleware(cx: Koa.Context & Ctx, next: Koa.Next) {
    if (cx.path === reqUri) {
      const result: UploadedResult = await (new Promise((rs) => {
        uploader.parse(cx.req, function(err: any, fields: Fields, files: Files) {
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