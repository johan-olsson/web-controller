(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){module.exports=require("./lib/renderer")},{"./lib/renderer":9}],2:[function(require,module,exports){"use strict";var MOD=65521;function adler32(data){var a=1;var b=0;for(var i=0;i<data.length;i++){a=(a+data.charCodeAt(i))%MOD;b=(b+a)%MOD}return a|b<<16}module.exports=adler32},{}],3:[function(require,module,exports){"use strict";function ElementsPool(){this.store={}}module.exports=ElementsPool;ElementsPool.prototype.allocate=function(name){var nodes=this.store[name];return nodes&&nodes.length?nodes.shift():this.createElement(name)};ElementsPool.prototype.deallocate=function(element){var name=element.nodeName.toLowerCase();if(this.store[name])this.store[name].push(element);else this.store[name]=[element]};ElementsPool.prototype.createElement=function(name){return name=="#text"?document.createTextNode(""):document.createElement(name)}},{}],4:[function(require,module,exports){"use strict";var adler32=require("./adler32");module.exports=function hashify(node){var attr,i;var str="";var nodes;if(!node)return str;if(node.name){str+=node.name;if(node.text)str+=node.text;for(attr in node.attributes){str+=attr+node.attributes[attr]}nodes=node.children}else{nodes=node}for(i in nodes){str+=hashify(nodes[i])}node.hash=adler32(str);return str}},{"./adler32":2}],5:[function(require,module,exports){"use strict";module.exports=function(obj,path){var parts,i;if(!obj||!path)return obj;parts=typeof path=="string"?path.split("."):path;for(i=0;i<parts.length;i++){obj=obj[parts[i]]}return obj}},{}],6:[function(require,module,exports){"use strict";var keypath=require("./keypath");var Node=require("./node");function Modifier(node){this.node=node}module.exports=Modifier;Modifier.EXCLUDE={length:true,parent:true};Modifier.prototype.apply=function(changes){for(var i=0;i<changes.length;i++){var change=changes[i];var prop=change.path[change.path.length-1];if(Modifier.EXCLUDE[prop])continue;var propIsNum=false;if(!isNaN(prop)){propIsNum=true;prop=Number(prop)}var method=this[prop];if(!method){if(propIsNum)method=this["children"];else method=this["attributes"]}method.call(this,change,prop)}};Modifier.prototype.text=function(change,prop){var path=change.path.slice(0,change.path.length-1);var now=change.values.now;var node=keypath(this.node.children,path);node.setText(now)};Modifier.prototype.children=function(change,prop){var now=change.values.now;var node;var path;if(change.change=="add"){if(typeof prop=="number"){if(change.path.length>1){path=change.path.slice(0,change.path.length-1);path.push(prop-1);node=keypath(this.node.children,path)}else{node=this.node}node.insertAt(prop,Node.create(now,node))}else{path=change.path.slice(0,change.path.length-1);node=keypath(this.node.children,path);for(var key in now){if(!Modifier.EXCLUDE[key])node.append(Node.create(now[key],node))}}}else if(change.change=="remove"){if(prop=="children"){path=change.path.slice(0,change.path.length-1);node=keypath(this.node.children,path);node.removeChildren()}else{path=change.path;node=keypath(this.node.children,path);if(node)node.parent.removeChild(node)}}};Modifier.prototype.attributes=function(change,prop){var now=change.values.now;var path;var node;if(change.change=="add"){if(prop=="attributes"){path=change.path.slice(0,change.path.length-1);node=keypath(this.node.children,path);node.setAttributes(now)}else{path=change.path.slice(0,change.path.length-2);node=keypath(this.node.children,path);node.setAttribute(prop,now)}}else if(change.change=="update"){path=change.path.slice(0,change.path.length-2);node=keypath(this.node.children,path);node.setAttribute(prop,now)}else if(change.change=="remove"){if(prop=="attributes"){path=change.path.slice(0,change.path.length-1);node=keypath(this.node.children,path);for(prop in change.values.original){node.removeAttribute(prop)}}else{path=change.path.slice(0,change.path.length-2);node=keypath(this.node.children,path);node.removeAttribute(prop)}}};Modifier.prototype.name=function(change,prop){var path=change.path.slice(0,change.path.length-1);var node=keypath(this.node.children,path);var now=change.values.now;node.setName(now)}},{"./keypath":5,"./node":7}],7:[function(require,module,exports){"use strict";var ElementsPool=require("./elements-pool");var queue=require("./render-queue");var pool=new ElementsPool;var counter=0;var nodesMap={};var ID_NAMESPACE="__diffRendererId__";function Node(options,parent){this.id=counter++;this.name=options.name;this.parent=parent;if(options.text)this.text=options.text;if(options.attributes)this.attributes=options.attributes;if(options.element){this.setTarget(options.element)}else{this.dirty("name",true);if(this.text)this.dirty("text",true);if(this.attributes)this.dirty("attributes",this.attributes)}if(options.children){this.children=[];for(var i in options.children){if(i!="length"){this.children[i]=Node.create(options.children[i],this);if(this.children[i].dirty())this.dirty("children",true)}}}nodesMap[this.id]=this}module.exports=Node;Node.create=function(options,parent){if(options.element&&options.element[ID_NAMESPACE]){return nodesMap[options.element[ID_NAMESPACE]]}return new Node(options,parent)};Node.prototype.toJSON=function(){var json={name:this.name};if(this.text)json.text=this.text;if(this.attributes)json.attributes=this.attributes;if(this.children){json.children={length:this.children.length};for(var i=0;i<this.children.length;i++){json.children[i]=this.children[i].toJSON()}}return json};Node.prototype.render=function(){if(!this._dirty)return;if(this.dirty("name")){if(this.target)this.migrate();else this.setTarget(pool.allocate(this.name));this.dirty("name",null)}if(this.dirty("children")&&this.children){var newChildren=[];for(var i=0;i<this.children.length;i++){var child=this.children[i];if(child.dirty()){if(child.dirty("remove")){this.removeChildAt(i);child.dirty("remove",null);delete nodesMap[child.id]}else{var next=this.children[i+1];child.render();this.target.insertBefore(child.target,next&&next.target);newChildren.push(child);child.dirty("insert",null);child.dirty("name",null)}}else{newChildren.push(child)}}if(newChildren)this.children=newChildren;this.dirty("children",null)}if(this.dirty("text")&&this.text){this.target.textContent=this.text;this.dirty("text",null)}if(this.dirty("attributes")){var attributes=this.dirty("attributes");for(var attrName in attributes){var value=attributes[attrName];if(value==null){delete this.attributes[attrName];if(this.name!="#text")this.target.removeAttribute(attrName)}else{if(!this.attributes)this.attributes={};this.attributes[attrName]=value;this.target.setAttribute(attrName,value)}}this.dirty("attributes",null)}};Node.prototype.removeChildAt=function(position){var child=this.children[position];child.detach();child.cleanup();if(child.children){for(var i=0;i<child.children.length;i++){child.removeChildAt(i)}}pool.deallocate(child.target);child.unlink()};Node.prototype.migrate=function(){this.detach();this.cleanup();var oldTarget=this.target;this.setTarget(pool.allocate(this.name));if(this.name=="#text"){this.children=null}else{this.text=null;while(oldTarget.hasChildNodes()){this.target.appendChild(oldTarget.removeChild(oldTarget.firstChild))}}pool.deallocate(oldTarget);this.dirty("insert",true)};Node.prototype.detach=function(){var parentNode=this.target.parentNode;if(parentNode)parentNode.removeChild(this.target)};Node.prototype.cleanup=function(){if(this.attributes){for(var attrName in this.attributes)this.target.removeAttribute(attrName)}if(this.text)this.target.textContent="";delete this.target[ID_NAMESPACE]};Node.prototype.removeChildren=function(){if(!this.children)return;for(var i=0;i<this.children.length;i++){this.children[i].dirty("remove",true)}this.dirty("children",true)};Node.prototype.removeChild=function(child){child.dirty("remove",true);this.dirty("children",true)};Node.prototype.unlink=function(){if(this.children){for(var i=0;i<this.children.length;i++){this.children[i].unlink()}}delete this.id;delete this.name;delete this.text;delete this.attributes;delete this.parent;delete this.children;delete this.target;delete this._dirty};Node.prototype.insertAt=function(position,node){this.dirty("children",true);node.dirty("insert",true);if(!this.children)this.children=[];this.children.splice(position,0,node)};Node.prototype.append=function(node){var position=this.children?this.children.length:0;this.insertAt(position,node)};Node.prototype.setAttributes=function(attributes){for(var name in attributes){this.setAttribute(name,attributes[name])}};Node.prototype.setAttribute=function(name,value){if(this.attributes&&this.attributes[name]==value)return;var attributes=this.dirty("attributes")||{};attributes[name]=value;this.dirty("attributes",attributes)};Node.prototype.removeAttribute=function(name){if(this.attributes&&this.attributes[name]!=null)this.setAttribute(name,null)};Node.prototype.setText=function(text){if(this.name!="#text"||text==this.text)return;this.dirty("text",true);this.text=text};Node.prototype.setName=function(name){if(name==this.name)return;this.dirty("name",true);this.parent.dirty("children",true);this.name=name};Node.prototype.setTarget=function(element){element[ID_NAMESPACE]=this.id;this.target=element};Node.prototype.dirty=function(name,value){if(value===undefined){return this._dirty&&name?this._dirty[name]:this._dirty}if(value===null){if(this._dirty){delete this._dirty[name];for(name in this._dirty)return;delete this._dirty}}else{if(!this._dirty){this._dirty={};queue.enqueue(this)}this._dirty[name]=value}}},{"./elements-pool":3,"./render-queue":8}],8:[function(require,module,exports){"use strict";var queue=module.exports=[];queue.enqueue=function(node){queue.push(node)};queue.empty=function(){queue.splice(0)}},{}],9:[function(require,module,exports){"use strict";var docdiff=require("docdiff");var keypath=require("./keypath");var Node=require("./node");var Modifier=require("./modifier");var serializeDom=require("./serialize-dom");var serializeHtml=require("./serialize-html");var renderQueue=require("./render-queue");var hashify=require("./hashify");function Renderer(element){if(!element)throw new TypeError("DOM element required");if(!(this instanceof Renderer))return new Renderer(element);this.node=null;this.modifier=null;this.refresh(element)}module.exports=Renderer;Renderer.serializeDom=serializeDom;Renderer.serializeHtml=serializeHtml;Renderer.keypath=keypath;Renderer.docdiff=docdiff;Renderer.hashify=hashify;Renderer.start=function(){function check(){if(!Renderer.running)return;Renderer.render();requestAnimationFrame(check)}Renderer.running=true;requestAnimationFrame(check)};Renderer.stop=function(){Renderer.running=false};Renderer.render=function(){if(!renderQueue.length)return;for(var i=0;i<renderQueue.length;i++){renderQueue[i].render()}renderQueue.empty();return this};Renderer.prototype.refresh=function(element){if(!element&&this.node)element=this.node.target;if(this.node)this.node.unlink();var json=serializeDom(element);this.node=Node.create(json);this.modifier=new Modifier(this.node);return this};Renderer.prototype.update=function(html){var next=serializeHtml(html).children;if(!next){this.node.removeChildren();return this}var current=this.node.toJSON().children||{};var diff=docdiff(current,next);this.modifier.apply(diff);return this}},{"./hashify":4,"./keypath":5,"./modifier":6,"./node":7,"./render-queue":8,"./serialize-dom":10,"./serialize-html":11,docdiff:13}],10:[function(require,module,exports){"use strict";module.exports=function serialize(element){var json={name:element.nodeName.toLowerCase(),element:element};if(json.name=="#text"){json.text=element.textContent;return json}var attr=element.attributes;if(attr&&attr.length){json.attributes={};var attrLength=attr.length;for(var i=0;i<attrLength;i++){json.attributes[attr[i].name]=attr[i].value}}var childNodes=element.childNodes;if(childNodes&&childNodes.length){json.children={length:childNodes.length};var childNodesLength=childNodes.length;for(var i=0;i<childNodesLength;i++){json.children[i]=serialize(childNodes[i])}}return json}},{}],11:[function(require,module,exports){"use strict";module.exports=function serialize(str,parent){if(!parent)parent={name:"root"};if(!str)return parent;var i=0;var end=false;var added=false;var current;var isWhite,isSlash,isOpen,isClose;var inTag=false;var inTagName=false;var inAttrName=false;var inAttrValue=false;var inCloser=false;var inClosing=false;var isQuote,openQuote;var attrName,attrValue;var inText=false;var json={parent:parent,name:""};while(!end){current=str[i];isWhite=current==" "||current=="\t"||current=="\r"||current=="\n";isSlash=current=="/";isOpen=current=="<";isClose=current==">";isQuote=current=="'"||current=='"';if(isSlash)inClosing=true;if(isClose)inCloser=false;if(current==null){end=true}else{if(inTag){if(inCloser){delete json.name}else if(inTagName||!json.name){inTagName=true;if(json.name&&isWhite||isSlash){inTagName=false;if(!json.name){inCloser=true;if(parent.parent)parent=parent.parent}}else if(isClose){serialize(str.substr(i+1),inClosing||inCloser?parent:json);return parent}else if(!isWhite){json.name+=current}}else if(inAttrName||!attrName){inAttrName=true;if(attrName==null)attrName="";if(isSlash||attrName&&isWhite||attrName&&current=="="){inAttrName=false;if(attrName){if(!json.attributes)json.attributes={};json.attributes[attrName]=""}}else if(isClose){serialize(str.substr(i+1),inClosing||inCloser?parent:json);return parent}else if(!isWhite){attrName+=current}}else if(inAttrValue||attrName){if(attrValue==null)attrValue="";if(isQuote){if(inAttrValue){if(current==openQuote){if(attrValue)json.attributes[attrName]=attrValue;inAttrValue=false;attrName=attrValue=null}else{attrValue+=current}}else{inAttrValue=true;openQuote=current}}else if(inAttrValue){attrValue+=current}}}else if(isOpen){if(inText){serialize(str.substr(i),parent);return parent}inTag=true}else if(isSlash&&!inAttrValue){end=true}else{inText=true;inTag=false;if(!json.name)json.name="#text";if(json.text==null)json.text="";json.text+=current}if(json.name&&!added){if(!parent.children)parent.children={length:0};parent.children[parent.children.length]=json;parent.children.length++;added=true}}if(isClose)inClosing=false;++i}return parent}},{}],12:[function(require,module,exports){var utils=require("./utils");var diffArrays=function(one,two){return one.filter(function(val){return two.indexOf(val)===-1})};var extractType=function(all){return function(val){if(utils.isObject(val)){all.primitives=false}else{all.documents=false}if(Array.isArray(val))all.primitives=false}};module.exports=function(original,now){var all={primitives:true,documents:true};original.forEach(extractType(all));now.forEach(extractType(all));var diff={change:null,now:now,original:original};if(all.primitives){diff.change="primitiveArray";diff.added=diffArrays(now,original);diff.removed=diffArrays(original,now)}else{diff.change=all.documents?"documentArray":"mixedArray"}return diff}},{"./utils":14}],13:[function(require,module,exports){var arraydiff=require("./arraydiff");var utils=require("./utils");module.exports=function docdiff(original,now,path,changes){if(!original||!now)return false;if(!path)path=[];if(!changes)changes=[];var keys=Object.keys(now);keys.forEach(function(key){var newVal=now[key];var origVal=original[key];if(utils.isObject(newVal)&&utils.isObject(origVal)){return docdiff(origVal,newVal,path.concat(key),changes)}if(Array.isArray(newVal)&&Array.isArray(origVal)){var diff=arraydiff(origVal,newVal);return changes.push(new Change(path,key,"update",diff.change,diff.now,diff.original,diff.added,diff.removed))}if(origVal!==newVal){var type=origVal===undefined?"add":"update";changes.push(new Change(path,key,type,"primitive",newVal,origVal))}});Object.keys(original).forEach(function(key){if(keys.indexOf(key)===-1)changes.push(new Change(path,key,"remove","primitive",null,original[key]))});return changes};function Change(path,key,change,type,now,original,added,removed){this.path=path.concat(key);this.change=change;this.type=type;this.values={};if(change!=="remove")this.values.now=now;if(change!=="add")this.values.original=original;if(type==="primitiveArray"){this.values.added=added;this.values.removed=removed}}},{"./arraydiff":12,"./utils":14}],14:[function(require,module,exports){exports.isObject=function(arg){return typeof arg==="object"&&arg!==null&&!Array.isArray(arg)}},{}],15:[function(require,module,exports){"use strict";module.exports.extends=function(prototype){Object.defineProperty(prototype,"parentComponent",{get:function parentComponent(){var node=arguments.length>0&&arguments[0]!==undefined?arguments[0]:this.element;if(!node)return null;if(node.component&&node.component!==this){return node}return parentComponent(node.parentElement||node.parentNode||node.host)}});Object.defineProperty(prototype,"childComponents",{get:function childComponents(){var node=arguments.length>0&&arguments[0]!==undefined?arguments[0]:[self.shadow];node=Array.prototype.slice.call(node,0).filter(function(node){return node});return node.map.call(node,function(node){if(node.children&&node.children.length)return childComponents(node.children);return node}).reduce(function(array,node){return array.concat(node)},[]).filter(function(node){return node.component})}});Object.defineProperty(prototype,"rootComponent",{get:function rootComponent(){var node=arguments.length>0&&arguments[0]!==undefined?arguments[0]:this.parentComponent;if(!node)return null;if(node.parentComponent)rootComponent(node.parentComponent);return node}})}},{}],16:[function(require,module,exports){"use strict";var DiffRenderer=require("diff-renderer");function WebController(options){Object.assign(this,options);this.shadow=this.element.createShadowRoot();this.renderer=new DiffRenderer(this.shadow)}require("./family").extends(WebController.prototype);require("./props").extends(WebController.prototype);require("./redraw").extends(WebController.prototype);require("./resources").extends(WebController.prototype);DiffRenderer.start();module.exports=WebController},{"./family":15,"./props":17,"./redraw":18,"./resources":19,"diff-renderer":1}],17:[function(require,module,exports){"use strict";function _defineProperty(obj,key,value){if(key in obj){Object.defineProperty(obj,key,{value:value,enumerable:true,configurable:true,writable:true})}else{obj[key]=value}return obj}module.exports.extends=function(prototype){prototype.setProps=function(props){var _this=this;if(!this.element)return console.warn("Cannot set props before component is mounted.");Object.keys(props).forEach(function(key){if(props[key]!==_this.element.getAttribute(key))_this.element.setAttribute(key,props[key])})};Object.defineProperty(prototype,"props",{get:function get(){return Array.prototype.map.call(this.element.attributes,function(attribute){return _defineProperty({},attribute.name,attribute.value)}).reduce(function(object,attribute){return Object.assign(object,attribute)},{})}})}},{}],18:[function(require,module,exports){"use strict";var _typeof=typeof Symbol==="function"&&typeof Symbol.iterator==="symbol"?function(obj){return typeof obj}:function(obj){return obj&&typeof Symbol==="function"&&obj.constructor===Symbol&&obj!==Symbol.prototype?"symbol":typeof obj};module.exports.extends=function(prototype){var textarea=document.createElement("textarea");prototype.redraw=function(){var _this=this;var html=this.template.innerHTML;var count=null;var code="";html.split("").forEach(function(char){switch(char){case"{":count++;break;case"}":count--;break}if(count!==null)code+=char;if(count===0){html=html.replace(code,function(){textarea.innerHTML=code;code=textarea.value.substring(1,textarea.value.length-1);var result=Function("return "+code).call(_this);switch(typeof result==="undefined"?"undefined":_typeof(result)){case"object":return result.join("");case"undefined":return code;default:return result}});count=null;code=""}});if(this.style)html+=this.style.outerHTML;this.renderer.update(html);return this}}},{}],19:[function(require,module,exports){"use strict";module.exports.extends=function(prototype){Object.defineProperty(prototype,"template",{get:function get(){return Array.prototype.find.call(this.root.children,function(element){return element instanceof HTMLTemplateElement})}});Object.defineProperty(prototype,"style",{get:function get(){return Array.prototype.find.call(this.root.children,function(element){return element instanceof HTMLStyleElement})}})}},{}],20:[function(require,module,exports){"use strict";var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor)}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor}}();function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called")}return call&&(typeof call==="object"||typeof call==="function")?call:self}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass)}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass}function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function")}}var Controller=require("./Controller");module.exports=function WebController(name){var options=arguments.length>1&&arguments[1]!==undefined?arguments[1]:{};_classCallCheck(this,WebController);var root=document.currentScript.parentElement;var ComponentElement=function(_HTMLElement){_inherits(ComponentElement,_HTMLElement);function ComponentElement(){_classCallCheck(this,ComponentElement);return _possibleConstructorReturn(this,(ComponentElement.__proto__||Object.getPrototypeOf(ComponentElement)).apply(this,arguments))}_createClass(ComponentElement,[{key:"createdCallback",value:function createdCallback(){this.component=new WebController(Object.assign(options,{element:this,root:root}));if(options.constructor){options.constructor.call(this.component)}if(options.componentWillMount){options.componentWillMount.call(this.component)}}},{key:"attachedCallback",value:function attachedCallback(){var _this2=this;var observer=new MutationObserver(function(mutations){mutations.forEach(function(mutation){mutation.addedNodes.forEach(function(node){if(node.attributes)Array.prototype.forEach.call(node.attributes,function(attribute){var match=attribute.name.match(/^on:(\w+)/);if(match)node.addEventListener(match[1],function(event){Function("return "+attribute.value).call(_this2.component).call(_this2.component,event)})})})})});observer.observe(this.shadowRoot,{childList:true});this.component.redraw();if(options.componentDidMount){options.componentDidMount.call(this.component)}}},{key:"detachedCallback",value:function detachedCallback(){if(options.componentWillUnmount){options.componentWillUnmount.call(this.component)}}},{key:"attributeChangedCallback",value:function attributeChangedCallback(name,from,to){if(options.componentWillReceiveProps){options.componentWillReceiveProps.call(this.component,name,from,to)}}}]);return ComponentElement}(HTMLElement);document.registerElement(name,ComponentElement)}},{"./Controller":16}]},{},[20]);
