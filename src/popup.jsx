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

/*function showError(e) {
    $('.ui.basic.modal').find('.header').text(e.message).end().modal('show');

}*/

function fetch () {
    return new Promise(function(resolve, reject) {
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
        });
        return positions;
    });
}


var ItemInfo = React.createClass({
    render: function () {
        return (<div className="item text">{this.props.keyName}：{this.props.value}</div>);
    }
});

var BasicInfo = React.createClass({
    render: function () {
        var annualSalary = this.props.item.minShowAnnualSalary+"~"+this.props.item.maxShowAnnualSalary;
        return (
            <div className="info-block clearfix">
                <ItemInfo keyName="预计年薪" value={annualSalary}></ItemInfo>
                <ItemInfo keyName="所在地" value={this.props.item.location}></ItemInfo>
                <ItemInfo keyName="汇报对象" value={this.props.item.reportTo}></ItemInfo>
                <ItemInfo keyName="所属部门" value={this.props.item.department}></ItemInfo>
                <ItemInfo keyName="招聘人数" value={this.props.item.headCount}></ItemInfo>
                <ItemInfo keyName="下属团队" value={this.props.item.subordinate}></ItemInfo>
            </div>
            );
    }
});

var CommissionPolicy = React.createClass({
    render: function () {
        return (
            <div className="info-block clearfix">
                <ItemInfo keyName="佣金比例" value={this.props.item.percentageNumbric}></ItemInfo>                
                <ItemInfo keyName="保证期" value={this.props.item.guaranteeTime}></ItemInfo>                
            </div>
            );
    }
});

var JobDescription = React.createClass({
    render: function () {
        return (
            <div className="info-block clearfix">
                <div className="text article">{this.props.item.jobDescription}</div>
            </div>
            );
    }
});

var JobRequirement = React.createClass({
    render: function () {
        return (
            <div className="info-block clearfix">
                <div className="text article">{this.props.item.jobRequirement}</div>
            </div>
            );
    }
});

var PostRequirement = React.createClass({
    render: function () {
        return (
            <div className="info-block clearfix">
                <ItemInfo keyName="学历" value={this.props.item.degreeRequired}></ItemInfo>
                <ItemInfo keyName="语言要求" value={this.props.item.languageRequired}></ItemInfo>
                <ItemInfo keyName="性别" value={this.props.item.genderRequired}></ItemInfo>
                <ItemInfo keyName="工作年限" value={this.props.item.workExpRequired}></ItemInfo>
                <ItemInfo keyName="面试流程" value={this.props.item.interviewTimes}></ItemInfo>
            </div>
            );
    }
});

var ResearchInfo = React.createClass({
    render: function () {
        return (
            <div className="info-block clearfix">
                <div className="text article">{this.props.item.importantMsg}</div>
            </div>
            );
    }
});

var Cv = React.createClass({
    render: function () {
        return (
            <div className="cv">
                <BasicInfo item={this.props.item}></BasicInfo>
                <CommissionPolicy item={this.props.item}></CommissionPolicy>
                <JobDescription item={this.props.item}></JobDescription>
                <JobRequirement item={this.props.item}></JobRequirement>
                <PostRequirement item={this.props.item}></PostRequirement>
                <ResearchInfo item={this.props.item}></ResearchInfo>
            </div>
            );
    }
});

var Page = React.createClass({
    getInitialState: function() {
        return {data: []};
    },
    componentDidMount: function () {
        fetch().then(function(positions){
            this.setState({
                data: positions
            });
        }.bind(this));
    },
    render: function () {

        var cvs = this.state.data.map(function(position){
            return (<Cv item={position}></Cv>);
        });

        return (
            <div>{cvs}</div>
            );
    }
});

ReactDOM.render(
  <Page />,
  document.getElementById('content')
);