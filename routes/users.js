var express = require('express');
var connection = require('../libs/dbConnect.js').dbConnect();
var router = express.Router();

router.get('/:city/:goo/:dong', function(req, res, next) {
    var foodListSQL = 'SELECT s.store_name, s.phone, s.city, s.goo, s.dong, s.lat, s.lng, s.etc, s.img, f.enroll_id, f.food_name, f.food_num, f.price, ' +
        'f.discount_price, f.update_time FROM store s LEFT JOIN food f ON s.phone=f.phone ' +
        'WHERE s.city=? AND s.goo=? AND s.dong=? AND f.enroll_id NOT IN(SELECT enroll_id FROM reserve_list)';
    var params = [req.params.city, req.params.goo, req.params.dong];
    noShowList(res, foodListSQL, params);
});

router.get('/best', function (req, res, next) {
    var bestSQL = 'SELECT s.store_name, s.phone, s.city, s.goo, s.dong, s.lat, s.lng, s.etc, s.img, f.enroll_id, f.food_name, f.food_num, f.price, ' +
        'f.discount_price, f.update_time FROM store s LEFT JOIN food f ON s.phone=f.phone ' +
        'WHERE f.enroll_id NOT IN(SELECT enroll_id FROM reserve_list) ORDER BY price/discount_price desc LIMIT 1';
    noShowList(res, bestSQL, []);
});

router.get('/recent', function (req, res, next) {
    var latestSQL = 'SELECT s.store_name, s.phone, s.city, s.goo, s.dong, s.lat, s.lng, s.etc, s.img, f.enroll_id, f.food_name, f.food_num, f.price, ' +
        'f.discount_price, f.update_time FROM store s LEFT JOIN food f ON s.phone=f.phone ' +
        'WHERE f.enroll_id NOT IN(SELECT enroll_id FROM reserve_list) ORDER BY f.update_time desc LIMIT 1';
    noShowList(res, latestSQL, []);
});

router.get('/reservation/:m', function (req, res, next) {
    var meter = req.params.m;
    var lat = req.query.lat;
    var lng = req.query.lng;
    var distanceSQL = 'SELECT phone, lat, lng FROM store';
    connection.query(distanceSQL, function (error, location) {
        if(error) {
            res.status(500).json({
                result: 'false',
                list: location
            });
        } else {
            var list = [];
            for(var i=0; i<location.length; i++) {
                var dist = getDistance(lat, lng, location[i].lat, location[i].lng);
                if(dist <= meter) {
                    list.push(location[i].phone);
                }
            }
            var nearbySQL = 'SELECT s.store_name, s.phone, s.city, s.goo, s.dong, s.lat, s.lng, s.etc, s.img, f.enroll_id, f.food_name, f.food_num, f.price, ' +
                'f.discount_price, f.update_time FROM store s LEFT JOIN food f ON s.phone=f.phone ' +
                'WHERE f.enroll_id NOT IN(SELECT enroll_id FROM reserve_list) AND f.phone IN(?)';
            noShowList(res, nearbySQL, list);
        }
    })
});

var rad = function(x) {
    return x * Math.PI / 180;
};
var getDistance = function(lat1, lng1, lat2, lng2) {
    var R = 6378137; // Earth’s mean radius in meter
    var dLat = rad(lat2 - lat1);
    var dLong = rad(lng2 - lng1);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(rad(lat1)) * Math.cos(rad(lat2)) *
        Math.sin(dLong / 2) * Math.sin(dLong / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // returns the distance in meter
};

var noShowList = function(res, SQL, params) {
    connection.query(SQL, params, function (error, list) {
        if(error) {
            res.status(500).json({
                result: 'false',
                list: list
            });
        } else {
            if(!list[0]) {
                res.status(404).json({
                    result: 'false',
                    list: list
                });
            } else {
                res.status(200).json({
                    result: 'true',
                    list: list
                });
            }
        }
    });
};

router.get('/:enroll_id', function(req, res, next) {
    getDetailInfo(res, [req.params.enroll_id]);
});

var getDetailInfo = function(res, params) {
    var detailSQL = 'SELECT * FROM store s RIGHT JOIN food f ON s.phone=f.phone WHERE f.enroll_id=?';
    connection.query(detailSQL, params, function (error, info) {
        if(error) {
            res.status(500).json({
                result: 'false',
                info: info[0],
                img: null
            });
        } else {
            getFoodImg(res, params, info);
        }
    });
};

var getFoodImg = function(res, params, info) {
    var imgSQL = 'SELECT food_img_url FROM food_img WHERE enroll_id=?';
    connection.query(imgSQL, params, function (error, img) {
        if(error) {
            res.status(500).json({
                result: 'false',
                info: info[0],
                img: null
            });
        } else {
            res.status(200).json({
                result: 'false',
                info: info[0],
                img: img
            });
        }
    });
};

router.post('/reservation', function (req, res, next) {
    var reserveSQL = 'INSERT INTO reserve_list(enroll_id, user_phone, arrival_time) values(?, ?, ?)';
    var params = [req.body.enroll_id, req.body.phone, req.body.arrival_time];
    connection.query(reserveSQL, params, function (error, info) {
        if(error) {
            res.status(500).json({ result: 'false' });
        } else {
            res.status(200).json({ result: 'true' });
        }
    });
});

module.exports = router;
