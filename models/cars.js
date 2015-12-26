var mongoose = require('mongoose');

var carSchema = mongoose.Schema({
    make: String,
    model: String,
    year: Number,
    color: String,
    yearPurchased:Number,
    yearSold:Number,
    totalled: Boolean,
    driver: String,
});

carSchema.methods.yearsDriven = function() {
    if(this.yearSold && this.yearSold > 0) {
        return this.yearSold - this.yearPurchased;
    }
    else {
        var currentTime = new Date();
        return currentTime.getFullYear() - this.yearPurchased;
    }
};

var carModel = mongoose.model('Cars', carSchema);
module.exports = carModel;

