$.fn.extend({
  select2Multiple: function(ajax, customSelection) {
    var select2 = this.select2({
      closeOnSelect: false,
      multiple: true,
      ajax: ajax,
      templateSelection: customSelection
    });
    // select all check
    if (this[0].dataset.selectAll === 'true') {
      $.each($(this).find('option'), (index, e) => { e.selected = true; });
      this.trigger('change');
    }
    return select2
      // Adding select all button
      .on('select2:close select2:open', function() {
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
          }).hover(function() {
            $('.select2-results__option').removeClass('select2-results__option--highlighted');
          });
        }
        // Prevent shake bug with multiple select
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
        $('.select2-results__option').removeClass('select2-results__option--highlighted');
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
        $('.select2-results__option').removeClass('select2-results__option--highlighted');
      });
  },
  select2MultipleClearAll: function() {
    $(this).val([]).trigger('change');
  }
});

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
    processResults: function(data) {
      var result = [];
      $.each(data, (key, items) => {
        var update_items=items.map( item => { return {
          id: key + '_' + item.id, 
          text: item.name,
          label: key
        }})
        result.push({ text: key, children: update_items })
      });
      return {
        results: result
      };
    }
  };
  var subjectCustomDisplay = (state) => {
    return state.label + ': ' + state.text
  }
  $.each(selectors, (index, e) => {
    $('.global-activities__side .' + e + '_selector select').select2Multiple();
    $('.global-activities__side .' + e + '_selector .clear').click(function() {
      $('.global-activities__side .' + e + '_selector select').select2MultipleClearAll();
    });
  });
  $('.global-activities__side .subject_selector select').select2Multiple(subjectAjaxQuery,subjectCustomDisplay);
  $('.global-activities__side .subject_selector .clear').click(function() {
    $('.global-activities__side .subject_selector select').select2MultipleClearAll();
  });

  $('#calendar_from_date').on('dp.change', function(e) {
    $('#calendar_to_date').data('DateTimePicker').minDate(e.date);
  });
  $('#calendar_to_date').on('dp.change', function(e) {
    $('#calendar_from_date').data('DateTimePicker').maxDate(e.date);
  });  
});

$('.date_selector .hot_button').click(function() {
  var selectPeriod = this.dataset.period;
  var fromDate = $('#calendar_from_date').data('DateTimePicker');
  var toDate = $('#calendar_to_date').data('DateTimePicker');
  var today = new Date();
  var yesterday = new Date(new Date().setDate(today.getDate() - 1));
  var weekDay = today.getDay();
  var monday = new Date(new Date().setDate(today.getDate() - weekDay + (weekDay === 0 ? -6 : 1)));
  var sunday = new Date(new Date().setDate(new Date(monday).getDate() + 6));
  var lastWeek = new Date(new Date().setDate(today.getDate() - 6));
  var firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  var lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  var lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
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
  var fromDate = new Date($('#calendar_from_date').val()).toGMTString();
  var toDate = new Date($('#calendar_to_date').val() + ' 23:59:59').toGMTString();
  return { from: fromDate, to: toDate };
}
