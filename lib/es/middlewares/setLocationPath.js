export default function setLocationPath(context, done) {
  var currentLocationPath = context.currentLocationPath,
      instance = context.instance;

  if (typeof currentLocationPath === "undefined") {
    context.currentLocationPath = context.to = getCurrentURLPath(instance.root);
  }

  context.currentLocationPath = instance._checkForAHash(currentLocationPath);
  done();
}