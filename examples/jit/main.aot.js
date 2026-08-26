let router, __rtcpl_r__ = [], __rtcpl_aot_fns__ = [($) => {
	let ResponseInfo = $[0], r0 = $[1], r1 = $[2];
	return (req) => {
		let { method, url } = req, pathStart = url.indexOf("/", 10), pathEnd = url.indexOf("?", pathStart + 1), path = -1 === pathEnd ? url.slice(pathStart) : url.slice(pathStart, pathEnd);
		if ("GET" === method) {
			let match = /^(?:\/@(?<org>[^/]+)\/(?<pkg>[^/]+)()$|$.)/.exec(path);
			if (null !== match && "" === match[3]) {
				let c = {
					req,
					res: new ResponseInfo(),
					params: match.groups
				};
				try {
					return r1(c);
				} catch (e) {
					return r0(e);
				}
			}
		}
		return new Response(null, { status: 404 });
	};
}], ref = (v) => __rtcpl_r__.push(v) - 1, routeUntyped = (method, pattern, fn, meta) => ({
	pattern,
	method,
	fn,
	meta
});
var RouterUntyped = class {
	pattern;
	parsers;
	routes;
	routers;
	constructor(pattern, parsers) {
		this.pattern = pattern;
		this.parsers = parsers;
		this.routes = [];
		this.routers = [];
	}
	route(method, pattern, fn, meta) {
		return this.routes.push(routeUntyped(method, pattern, fn, meta)), this;
	}
	any(pattern, fn, meta) {
		return this.routes.push(routeUntyped("", pattern, fn, meta)), this;
	}
	query(pattern, fn, meta) {
		return this.routes.push(routeUntyped("QUERY", pattern, fn, meta)), this;
	}
	get(pattern, fn, meta) {
		return this.routes.push(routeUntyped("GET", pattern, fn, meta)), this;
	}
	post(pattern, fn, meta) {
		return this.routes.push(routeUntyped("POST", pattern, fn, meta)), this;
	}
	put(pattern, fn, meta) {
		return this.routes.push(routeUntyped("PUT", pattern, fn, meta)), this;
	}
	del(pattern, fn, meta) {
		return this.routes.push(routeUntyped("DELETE", pattern, fn, meta)), this;
	}
	patch(pattern, fn, meta) {
		return this.routes.push(routeUntyped("PATCH", pattern, fn, meta)), this;
	}
	options(pattern, fn, meta) {
		return this.routes.push(routeUntyped("OPTIONS", pattern, fn, meta)), this;
	}
	trace(pattern, fn, meta) {
		return this.routes.push(routeUntyped("TRACE", pattern, fn, meta)), this;
	}
	mount(...routers) {
		return this.routers.push(...routers), this;
	}
	error;
	beforeParse;
	afterParse;
	on(event, handler) {
		return this[event] = handler, this;
	}
};
var ResponseInfo = class {
	headers;
	status;
	statusText;
	constructor() {
		this.headers = new Headers();
	}
	setHeader(key, value) {
		this.headers.set(key, value);
	}
	appendHeader(key, value) {
		this.headers.append(key, value);
	}
	body(body) {
		return new Response(body, this);
	}
	html(body) {
		return this.headers.set("content-type", "text/html"), new Response(body, this);
	}
	json(obj) {
		return Response.json(obj, this);
	}
};
let hydrateRouter = (router) => {
	"function" == typeof router.error && ref(router.error);
	"function" == typeof router.beforeParse && ref(router.beforeParse);
	for (let i = 0, { parsers } = router; i < parsers.length; i++) {
		let parser = parsers[i];
		if ("string" == typeof parser.name) {
			let { name } = parser;
			if ("req" === name) throw Error("cannot override c.req!");
			if ("res" === name) throw Error("cannot override c.res!");
		}
		ref(parser.init);
		"function" == typeof parser.deinit && ref(parser.deinit);
	}
	"function" == typeof router.afterParse && ref(router.afterParse);
	for (let i = 0, routers = router.routers; i < routers.length; i++) hydrateRouter(routers[i]);
}, errorResponse = new Response(null, { status: 500 });
var main_default = { fetch: (router = new RouterUntyped("/@:org", []).get("/:pkg", ({ res, params }) => (res.headers.set("Powered-By", "mapl"), res.body(`package: @${params.org}/${params.pkg}`))).on("error", (err) => (console.error(err), errorResponse)), ref(ResponseInfo), hydrateRouter(router), __rtcpl_aot_fns__.pop()(__rtcpl_r__)) };
export { main_default as default };
