import { QContext } from "../../index";
import { undefinedOrTrue } from "../utils";

export default function callHandler(context: QContext, done) {
  if (undefinedOrTrue(context.navigateOptions, "callHandler")) {
    context.match.route.handler(context.match);
  }
  context.instance.updatePageLinks({ removeExisting: false });
  done();
}
