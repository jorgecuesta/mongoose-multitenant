/**
 * Created by jorgecuesta on 3/6/16.
 */
var dbURI = 'mongodb://localhost/demo-app-clearing-db',
    should = require('chai').should(),
    mongoose = require('mongoose'),
    multitenant = require('../index'),
    Dummy, Foo,
    plugin,
    counter = 0,
    clearDB = require('mocha-mongoose')(dbURI);

multitenant.setup(mongoose);

plugin = function lastModifiedPlugin(schema, options) {
    if (schema.notPlug) {
        return;
    }

    console.log('## Registering plugin on schema', counter++, '\n');

    schema.pre('validate', function (next) {
        var DummyClass = this, _tenantid;

        _tenantid = DummyClass.getTenantId();

        _tenantid.should.equal('tenant1');

        var FooClass = DummyClass.getModel('Foo');

        _tenantid = FooClass.getTenantId();

        _tenantid.should.equal('tenant1');

        var myFoo = new FooClass({
            title: 'My Foo'
        });

        return myFoo.save(function (err, results) {
            return mongoose.mtModel('tenant1.Foo').find(function (err, results) {
                results.length.should.equal(1);
                results[0].title.should.equal('My Foo');
                return next();
            });
        });
    });
};

// Register plugin.
mongoose.plugin(plugin);

Dummy = new mongoose.Schema({
    title: String
});

Foo = new mongoose.Schema({
    title: String
});

Foo.notPlug = true;

mongoose.mtModel('Dummy', Dummy);
mongoose.mtModel('Foo', Foo);

describe('Multitenant with Hooks', function () {

    beforeEach(function (done) {
        if (mongoose.connection.db) return done();

        mongoose.connect(dbURI, done);
    });

    it('should be able to create a foo model for a tenant with only pre hook only once time', function (done) {

        var self = this, myDummy,
            dummyClass = mongoose.mtModel('tenant1.Dummy');

        myDummy = new dummyClass({
            title: 'My Dummy'
        });

        return myDummy.save(function (err, results) {
            self.dummy = results;

            return mongoose.mtModel('tenant1.Dummy').find(function (err, results) {
                results.length.should.equal(1);
                results[0].title.should.equal('My Dummy');
                return done();
            });
        });
    });

    it("can clear the DB on demand", function (done) {
        clearDB(function (err) {
            if (err) return done(err);

            mongoose.mtModel('tenant1.Dummy').find({}, function (err, docs) {
                if (err) return done(err);
                docs.length.should.equal(0);
                done();
            });
        });
    });

});

