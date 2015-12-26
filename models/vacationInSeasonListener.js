/**
 * Created by Cezar on 12/14/2015.
 */

var mongoose = require('mongoose');

var vacationInSeasonListenerSchema = mongoose.Schema({
    email: String,
    skus: [String],
});

var VacationInSeasonListener = mongoose.model('VacationInSeasonListener', vacationInSeasonListenerSchema);
module.exports = VacationInSeasonListener;

