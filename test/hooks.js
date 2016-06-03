/**
 * Created by jorgecuesta on 3/6/16.
 */
var dbURI = 'mongodb://localhost/demo-app-clearing-db',
    should = require('chai').should(),
    mongoose = require('mongoose'),
    multitenant = require('../index'),
    Dummy = null,
    clearDB = require('mocha-mongoose')(dbURI);

multitenant.setup(mongoose);

Dummy = new mongoose.Schema({
    title: String
});

Dummy.pre('validate', function (next) {
    var model = this, _tenantid;

    _tenantid = model.getTenantId();

    _tenantid.should.equal('tenant1');

    next();
});

mongoose.mtModel('Dummy', Dummy);

describe('Multitenant with Hooks', function () {

    beforeEach(function (done) {
        if (mongoose.connection.db) return done();

        mongoose.connect(dbURI, done);
    });

    it('should be able to create a foo model for a tenant with only pre hook only once time', function (done) {

        var fooClass, myFoo, self = this;
        fooClass = mongoose.mtModel('tenant1.Dummy');

        myFoo = new fooClass({
            title: 'My Foo'
        });

        return myFoo.save(function (err, results) {
            self.foo = results;

            return mongoose.mtModel('tenant1.Dummy').find(function (err, results) {
                results.length.should.equal(1);
                results[0].title.should.equal('My Foo');
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

