/**
 * Copyright (C) 2014 yanni4night.com
 * popup.js
 *
 * changelog
 * 2015-12-21[23:58:37]:revised
 *
 * @author yanni4night@gmail.com
 * @version 0.1.0
 * @since 0.1.0
 */

var pageSize = 100;

function getQueryUrl(start) {
    return 'http://hd.hunteron.com/api/v1/position/query?_t=' + Date.now() + '&cityId=30101&industryId=101&size=' +
        pageSize + '&start=' + start;
}

function queryJobs(cb) {
    var jobList = [];

    $.getJSON(getQueryUrl(0)).done(function (ret) {
        var total = ret.data.total;
        var remainQueries = Math.ceil(total / pageSize) - 1;

        if (ret.data && Array.isArray(ret.data.positions)) {
            jobList = jobList.concat(ret.data.positions);
        }

        var queries = [];

        for (var i = 0; i < remainQueries; ++i) {
            queries.push($.getJSON(getQueryUrl((1 + i) * pageSize)));
        }
        $.when.apply($, queries).done(function () {
            Array.prototype.map.call(arguments, function (rets) {
                var ret = rets[0];
                if (ret.data && Array.isArray(ret.data.positions)) {
                    jobList = jobList.concat(ret.data.positions);
                }
            });
            var finalJobs = jobList.filter(function (pos) {
                return pos.positionType != 0 || pos.applyStatus === 1;
            });

            cb(finalJobs);
        });

    }).fail(function () {
        console.log('fail');
    });
}

function queryJobDetail(jobIds) {
    var promises = jobIds.map(function (id) {
        return new Promise(function (resolve) {
            $.getJSON('http://hd.hunteron.com/api/v1/position/detail?_t=' + Date.now() + '&positionId=' +
                id).done(function (data) {
                resolve(data);
            });
        });
    });

    return Promise.all(promises);
}

$('button').click(function () {
    new Promise(function (resolve) {
        queryJobs(function (jobs) {
            resolve(jobs.map(function (item) {
                return item.positionId;
            }).slice(0, 5));
        });
    }).then(function (jobIds) {
        return queryJobDetail(jobIds);
    }).then(function (data) {
        var positions = data.map(function (item) {
            return item.data.position;
        }).forEach(function (item, idx) {
            $('<tr><td>' + (idx + 1) + '</td><td>' + item.positionTitle + '</td></tr>').appendTo(
                $('tbody'));
        });

    }).catch(function (e) {
        alert(e.message);
    });

});