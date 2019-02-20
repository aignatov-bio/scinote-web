$.fn.extend({
  select2Multiple: function(config = {}) {
    var select2 = this.select2({
      closeOnSelect: false,
      multiple: true,
      ajax: config.ajax,
      templateSelection: config.customSelection
    });
    // select all check
    this[0].dataset.singleDisplay=config.singleDisplay || false
    if (this[0].dataset.selectAll === 'true') {
      $.each($(this).find('option'), (index, e) => { e.selected = true; });
      this.trigger('change');
    }
    select2.updateSingleName()
    return select2
      // Adding select all button
      .on('select2:open', function() {
        var selectElement = this;
        $('.select2-selection').scrollTo(0);
        $('.select2_select_all').remove();
        if (selectElement.dataset.selectAllButton !== undefined) {
          $('<div class="select2_select_all btn btn-default"><strong>' + selectElement.dataset.selectAllButton + '</strong></div>').prependTo('.select2-dropdown').on('click', function() {
            var elementsToSelect = $.map($(selectElement).find('option'), e => e.value);
            if ($(selectElement).find('option:selected').length === elementsToSelect.length) elementsToSelect = [];
            $(selectElement).val(elementsToSelect).trigger('change');
            $(selectElement).select2('close');
            $(selectElement).select2('open');
          });
        }
      })
      // Prevent shake bug with multiple select
      .on('select2:open select2:close', function() {
        if ($(this).val() != null && $(this).val().length > 3) {
          $(this).next().find('.select2-search__field')[0].disabled = true;
        } else {
          $(this).next().find('.select2-search__field')[0].disabled = false;
        }
      })
      // Prevent opening window when deleteing selection
      .on('select2:unselect', function() {
        var resultWindow = $('.select2-container--open');
        if (resultWindow.length === 0) {
          $(this).select2('open');
        }
      })
      // Fxied scroll bug
      .on('select2:selecting select2:unselecting', function(e) {
        $(e.currentTarget).data('scrolltop', $('.select2-results__options').scrollTop());
        $('.select2-selection').scrollTo(0);
      })
      // Fxied scroll bug
      .on('select2:select select2:unselect', function(e) {
        $('.select2-selection').scrollTo(0);
        $('.select2-results__options').scrollTop($(e.currentTarget).data('scrolltop'));
        $(this).updateSingleName()
      });
  },
  select2MultipleClearAll: function() {
    $(this).val([]).trigger('change');
  },
  updateSingleName: function() {
    var selectElement=this
    var selectedOptions=selectElement.next().find('.select2-selection__choice')
    var optionsCounter=selectedOptions.length
    var allOptionsSelected= this.find('option').length == optionsCounter
    var optionText=allOptionsSelected ? this[0].dataset.selectMultipleAllSelected : optionsCounter+" "+this[0].dataset.selectMultipleName
    if (optionsCounter > 1){
      selectedOptions.remove()
      template='<li class="select2-selection__choice">'+
                  '<span class="select2-selection__choice__remove" role="presentation">×</span>'+
                    optionText+
                '</li>'
      $(template).prependTo(selectElement.next().find('.select2-selection__rendered')).find('.select2-selection__choice__remove')
                 .click(function(){ selectElement.select2MultipleClearAll() })
    }
  }
});

Date.prototype.date_to_string = function() {
  return this.getFullYear() + '-' + (this.getMonth() + 1) + '-' + this.getDate();
};


$(function() {
  var selectors = ['team', 'activity', 'user'];
  // Ajax request for object search
  var subjectAjaxQuery = {
    url: '/global_activities/test_query',
    dataType: 'json',
    data: function(params) {
      return {
        search_query: params.term // search term
      };
    },
    // preparing results
    processResults: function(data) {
      var result = [];
      $.each(data, (key, items) => {
        var updateItems = items.map(item => {
          return {
            id: key + '_' + item.id,
            text: item.name,
            label: key
          };
        });
        result.push({ text: key, children: updateItems });
      });
      return {
        results: result
      };
    }
  };
  // custom display function
  var subjectCustomDisplay = (state) => {
    return state.label + ': ' + state.text;
  };
  // Common selection intialize
  $.each(selectors, (index, e) => {
    $('.global-activities__side .' + e + '-selector select').select2Multiple({ singleDisplay: true});
    $('.global-activities__side .' + e + '-selector .clear').click(function() {
      $('.global-activities__side .' + e + '-selector select').select2MultipleClearAll();
    });
  });
  // Object selection intialize
  $('.global-activities__side .subject-selector select').select2Multiple({ ajax: subjectAjaxQuery, customSelection: subjectCustomDisplay});
  $('.global-activities__side .subject-selector .clear').click(function() {
    $('.global-activities__side .subject-selector select').select2MultipleClearAll();
  });

  $('#calendar-from-date').on('dp.change', function(e) {
    $('#calendar-to-date').data('DateTimePicker').minDate(e.date);
  });
  $('#calendar-to-date').on('dp.change', function(e) {
    $('#calendar-from-date').data('DateTimePicker').maxDate(e.date);
  });
});

$('.date-selector .hot-button').click(function() {
  var selectPeriod = this.dataset.period;
  var fromDate = $('#calendar-from-date').data('DateTimePicker');
  var toDate = $('#calendar-to-date').data('DateTimePicker');
  var today = new Date();
  var yesterday = new Date(new Date().setDate(today.getDate() - 1));
  var weekDay = today.getDay();
  var monday = new Date(new Date().setDate(today.getDate() - weekDay + (weekDay === 0 ? -6 : 1)));
  var sunday = new Date(new Date().setDate(new Date(monday).getDate() + 6));
  var lastWeek = new Date(new Date().setDate(today.getDate() - 6));
  var firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  var lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  var lastMonth = new Date(new Date().setDate(today.getDate() - 30));
  if (selectPeriod === 'today') {
    toDate.date(today);
    fromDate.date(today);
  } else if (selectPeriod === 'yesterday') {
    fromDate.date(yesterday);
    toDate.date(yesterday);
  } else if (selectPeriod === 'this_week') {
    toDate.date(sunday);
    fromDate.date(monday);
  } else if (selectPeriod === 'last_week') {
    toDate.date(today);
    fromDate.date(lastWeek);
  } else if (selectPeriod === 'this_month') {
    toDate.date(lastDay);
    fromDate.date(firstDay);
  } else if (selectPeriod === 'last_month') {
    toDate.date(today);
    fromDate.date(lastMonth);
  }
});

function GlobalActivitiesFiltersGetDates() {
  var fromDate = $('#calendar-from-date').data('DateTimePicker').date()._d.date_to_string();
  var toDate = $('#calendar-to-date').data('DateTimePicker').date()._d.date_to_string();
  return { from: fromDate, to: toDate };
}

function GlobalActivitiesFilterPrepareArray() {
  var teamFilter = ($('.global-activities__side .team-selector select').val() || [])
    .map(e => { return parseInt(e, 10); });
  var userFilter = ($('.global-activities__side .user-selector select').val() || [])
    .map(e => { return parseInt(e, 10); });
  var activityFilter = ($('.global-activities__side .activity-selector select').val() || [])
    .map(e => { return parseInt(e, 10); });
  var subjectFilter = {};
  $.each(($('.global-activities__side .subject-selector select').val() || []), function(index, object) {
    var splitObject = object.split('_');
    if (subjectFilter[splitObject[0]] === undefined) subjectFilter[splitObject[0]] = [];
    subjectFilter[splitObject[0]].push(parseInt(splitObject[1], 10));
  });
  return {
    teams: JSON.stringify(teamFilter),
    users: JSON.stringify(userFilter),
    types: JSON.stringify(activityFilter),
    subjects: JSON.stringify(subjectFilter),
    from_date: GlobalActivitiesFiltersGetDates().from,
    to_date: GlobalActivitiesFiltersGetDates().to
  };
}
