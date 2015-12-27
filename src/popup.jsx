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

function queryJobDetail(id) {
    return new Promise(function (resolve) {
        $.getJSON('http://hd.hunteron.com/api/v1/position/detail?_t=' + Date.now() + '&positionId=' +
            id).done(function (data) {
            resolve(data);
        });
    });
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
            <fieldset className="info-block clearfix">
                <legend>基本信息</legend>
                <ItemInfo keyName="预计年薪" value={annualSalary}></ItemInfo>
                <ItemInfo keyName="所在地" value={this.props.item.location}></ItemInfo>
                <ItemInfo keyName="汇报对象" value={this.props.item.reportTo}></ItemInfo>
                <ItemInfo keyName="所属部门" value={this.props.item.department}></ItemInfo>
                <ItemInfo keyName="招聘人数" value={this.props.item.headCount}></ItemInfo>
                <ItemInfo keyName="下属团队" value={this.props.item.subordinate}></ItemInfo>
            </fieldset>
            );
    }
});

var CommissionPolicy = React.createClass({
    render: function () {
        return (
            <fieldset className="info-block clearfix">
                <legend>佣金政策</legend>
                <ItemInfo keyName="佣金比例" value={this.props.item.percentageNumbric}></ItemInfo>                
                <ItemInfo keyName="保证期" value={this.props.item.guaranteeTime}></ItemInfo>                
            </fieldset>
            );
    }
});

var JobDescription = React.createClass({
    render: function () {
        return (
            <fieldset className="info-block clearfix">
                <legend>职位描述</legend>
                <div className="text article">{this.props.item.jobDescription}</div>
            </fieldset>
            );
    }
});

var JobRequirement = React.createClass({
    render: function () {
        return (
            <fieldset className="info-block clearfix">
                <legend>任职要求</legend>
                <div className="text article">{this.props.item.jobRequirement}</div>
            </fieldset>
            );
    }
});

var PostRequirement = React.createClass({
    render: function () {
        return (
            <fieldset className="info-block clearfix">
                <legend>岗位要求</legend>
                <ItemInfo keyName="学历" value={this.props.item.degreeRequired}></ItemInfo>
                <ItemInfo keyName="语言要求" value={this.props.item.languageRequired}></ItemInfo>
                <ItemInfo keyName="性别" value={this.props.item.genderRequired}></ItemInfo>
                <ItemInfo keyName="工作年限" value={this.props.item.workExpRequired}></ItemInfo>
                <ItemInfo keyName="面试流程" value={this.props.item.interviewTimes}></ItemInfo>
            </fieldset>
            );
    }
});

var ResearchInfo = React.createClass({
    rawMarkup: function () {
        var rawMarkup = this.props.item.importantMsg||'无';
        return { __html: rawMarkup };
    },
    render: function () {
        return (
            <fieldset className="info-block clearfix">
                <legend>调研信息</legend>
                <div className="text article" dangerouslySetInnerHTML={this.rawMarkup()} ></div>
            </fieldset>
            );
    }
});

var EnterpriseInfo = React.createClass({
    getInitialState: function () {
        return {info: {}};
    },
    componentDidMount: function () {
        var id = this.props.enterpriseId;

        if (!this.constructor.__cache) {
            this.constructor.__cache = {};
        }

        if (id in this.constructor.__cache) {
            this.setState({
                info: this.constructor.__cache[id]
            });
        } else {
            $.getJSON('http://hd.hunteron.com/api/v1/enterprise/detail/getById?_t=' + Date.now() + '&enterpriseId=' +
                id).done(function (ret) {
                this.setState({
                    info: ret.data
                });
                this.constructor.__cache[id] = ret.data;
            }.bind(this));
        }
    },
    scale: function (scaleId) {
        return ["1-49人", "50-99人", "100-499人", "500-999人", "1000-4999人", "5000-9999人", "10000+人"][scaleId] || '';
    },
    developStatus: function(developStatusId) {
        var e = {
            1: "未融资",
            2: "天使轮",
            3: "A轮",
            4: "B轮",
            5: "C轮",
            6: "D轮及以上",
            7: "上市公司"
        };
        return e[developStatusId] || '';
    },
    companyNature: function (companyNatureId) {
        var e = ["外商独资/外企办事处", "国内上市公司", "中外合资", "政府机关", "国有企业", "民企/私营企业", "外企代表处", "其他", "非赢利机构"];
        return e[companyNatureId] || '';
    },
    render: function () {
         return (
            <fieldset className="info-block clearfix">
                <legend>公司信息</legend>
                <div className="text article">
                    <h2>{this.state.info.displayName}</h2>
                    <h6>地址：{this.state.info.address}</h6>
                    <div className="tags">
                        <span className="tag">规模：{this.scale(this.state.info.scale)}</span>
                        <span className="tag">阶段：{this.developStatus(this.state.info.developStatus)}</span>
                        <span className="tag">性质：{this.companyNature(this.state.info.style)}</span>
                    </div>
                    {this.state.info.introduce}
                </div>
            </fieldset>
            );
    }
});

var Cv = React.createClass({
    render: function () {
        return (
            <div className="cv">
                <h1>{this.props.item.positionTitle}</h1>
                <BasicInfo item={this.props.item}></BasicInfo>
                <CommissionPolicy item={this.props.item}></CommissionPolicy>
                <JobDescription item={this.props.item}></JobDescription>
                <JobRequirement item={this.props.item}></JobRequirement>
                <PostRequirement item={this.props.item}></PostRequirement>
                <ResearchInfo item={this.props.item}></ResearchInfo>
                <EnterpriseInfo enterpriseId={this.props.item.enterpriseId}></EnterpriseInfo>
            </div>
            );
    }
});

var Page = React.createClass({
    getInitialState: function() {
        return {
            positions: [],
            success: 0,
            total: 0,
            failed: 0
        };
    },
    componentDidMount: function () {
        fetch().then(function (jobIds) {
            this.setState({
                total: jobIds.length
            });
            jobIds.forEach(function(id){
                queryJobDetail(id).then(function(ret){
                    this.setState({
                        positions: this.state.positions.concat(ret.data.position),
                        success: this.state.success + 1,
                    });
                }.bind(this),function(){
                    this.setState({
                        failed: this.state.failed + 1
                    });
                }.bind(this));
            }.bind(this));
        }.bind(this));
    },
    render: function () {

        var cvs = this.state.positions.map(function(position){
            return (<Cv item={position}></Cv>);
        });

        return (
            <div className="page">
                <nav>成功：{this.state.success}，失败：{this.state.failed}，总数：{this.state.total}</nav>
                <div className="content">{cvs}</div>
            </div>
            );
    }
});

ReactDOM.render(
  <Page />,
  document.getElementById('content')
);