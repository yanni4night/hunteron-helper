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

var DEBUG = true;

var pageSize = DEBUG ? 15 : 100;



function getQueryUrl(start) {
    return 'http://hd.hunteron.com/api/v1/position/query?_t=' + Date.now() + '&cityId=30101&industryId=101&size=' +
        pageSize + '&start=' + start;
}

function queryJobs(cb) {
    var jobList = [];

    $.getJSON(getQueryUrl(0)).done(function(ret) {

        if (!ret || !ret.success) {
            return cb(new Error(ret && ret.message || '未知错误'));
        }

        var total = ret.data.total;
        var remainQueries = DEBUG ? 0 : Math.ceil(total / pageSize) - 1;



        if (ret.data && Array.isArray(ret.data.positions)) {
            jobList = jobList.concat(ret.data.positions);
        }

        /*if (debug) {
            return cb(null, jobList);
        }*/

        var queries = [];

        for (var i = 0; i < remainQueries; ++i) {
            queries.push($.getJSON(getQueryUrl((1 + i) * pageSize)));
        }

        $.when.apply($, queries).done(function() {
            Array.prototype.map.call(arguments, function(rets) {
                var ret = rets[0];
                if (ret.data && Array.isArray(ret.data.positions)) {
                    jobList = jobList.concat(ret.data.positions);
                }
            });
            var finalJobs = jobList.filter(function(pos) {
                return pos.positionType != 0 || pos.applyStatus === 1;
            }).map(function(item) {
                return item.positionId;
            });

            cb(null, finalJobs);
        });

    }).fail(function() {
        cb(new Error('fail'));
    });
}

function queryJobDetail(jobIds) {
    var promises = jobIds.map(function(id) {
        return new Promise(function(resolve) {
            $.getJSON('http://hd.hunteron.com/api/v1/position/detail?_t=' + Date.now() + '&positionId=' +
                id).done(function(data) {
                resolve(data);
            });
        });
    });

    return Promise.all(promises);
}

function showError(e) {
    $('.ui.basic.modal').find('.header').text(e.message).end().modal('show');

}

$('button').click(function() {
    new Promise(function(resolve, reject) {
        queryJobs(function(err, jobIds) {
            if (err) {
                reject(err);
            } else {
                resolve(jobIds);
            }
        });
    }).then(function(jobIds) {
        return queryJobDetail(jobIds);
    }).then(function(data) {
        var positions = data.map(function(item) {
            return item.data.position;
        }).forEach(function(item, idx) {
            $('<tr><td>' + (idx + 1) + '</td><td>' + item.positionTitle + '</td><td>'+item.jobDescription+'</td><td>'+item.jobRequirement+'</td></tr>').appendTo(
                $('tbody'));
        });

    }).catch(showError);

});