import Koa from 'koa';
import { Fields, Files } from 'formidable';
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
declare function uploadApi<Ctx>(options: UploadApiOptions<Ctx>): (cx: Koa.Context & Ctx, next: Koa.Next) => Promise<void>;
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
