.PHONY: compile dist

compile:
	npm run prepare

dist:
	npm pack
	mv shanhuio-misc-0.0.0.tgz misc.tgz

fmt:
	tsfmt -r `find ./src -name "*.tsx"`
