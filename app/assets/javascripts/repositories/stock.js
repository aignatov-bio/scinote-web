/* global dropdownSelector GLOBAL_CONSTANTS I18n SmartAnnotation formatDecimalValue */

var RepositoryStockValues = (function() {
  const UNIT_SELECTOR = '#repository-stock-value-units';

  function updateChangeAmount($element) {
    var currentAmount = parseFloat($element.data('currentAmount'));
    var inputAmount = parseFloat($element.val());
    var newAmount;

    if (!$element.val()) {
      $('.stock-final-container .value').text('-');
      return;
    }
    if (!(inputAmount >= 0)) return;

    switch ($element.data('operator')) {
      case 'set':
        newAmount = inputAmount;
        break;
      case 'add':
        newAmount = currentAmount + inputAmount;
        break;
      case 'remove':
        newAmount = currentAmount - inputAmount;
        break;
      default:
        newAmount = currentAmount;
        break;
    }
    $('#change_amount').val(inputAmount);

    $('#repository_stock_value_amount').val(newAmount);
    $('.stock-final-container').toggleClass('negative', newAmount < 0);
    $('.stock-final-container .value').text(
      formatDecimalValue(String(newAmount), $('#stock-input-amount').data('decimals'))
    );
  }

  function initManageAction() {
    let amountChanged = false;

    $('.repository-show').on('click', '.manage-repository-stock-value-link', function() {
      $.ajax({
        url: $(this).closest('tr').data('manage-stock-url'),
        type: 'GET',
        dataType: 'json',
        success: (result) => {
          var $manageModal = $('#manage-repository-stock-value-modal');
          $manageModal.find('.modal-content').html(result.html);

          dropdownSelector.init(UNIT_SELECTOR, {
            singleSelect: true,
            closeOnSelect: true,
            noEmptyOption: true,
            selectAppearance: 'simple',
            onChange: function() {
              let unit = '';
              if (dropdownSelector.getValues(UNIT_SELECTOR) > 0) {
                unit = dropdownSelector.getLabels(UNIT_SELECTOR);
              }
              $('.stock-final-container .units').text(unit);
              $('.repository-stock-reminder-value .units').text(
                I18n.t('repository_stock_values.manage_modal.units_remaining', {
                  unit: unit
                })
              );
            }
          });

          $manageModal.find(`
            .dropdown-selector-container .input-field,
            .dropdown-selector-container .search-field
          `).attr('tabindex', 2);

          $manageModal.find('form').on('ajax:success', function() {
            var dataTable = $('.dataTable').DataTable();
            $manageModal.modal('hide');
            dataTable.ajax.reload(null, false);
          });

          $('.stock-operator-option').click(function() {
            var $stockInput = $('#stock-input-amount');
            $('.stock-operator-option').removeClass('btn-primary').addClass('btn-secondary');
            $(this).removeClass('btn-secondary').addClass('btn-primary');
            $stockInput.data('operator', $(this).data('operator'));

            dropdownSelector.selectValues(UNIT_SELECTOR, $('#initial_units').val());
            $('#operator').val($(this).data('operator'));

            switch ($(this).data('operator')) {
              case 'set':
                dropdownSelector.enableSelector(UNIT_SELECTOR);
                if (!amountChanged) { $stockInput.val($stockInput.data('currentAmount')); }
                break;
              case 'add':
                if (!amountChanged) { $stockInput.val(''); }
                dropdownSelector.disableSelector(UNIT_SELECTOR);
                break;
              case 'remove':
                if (!amountChanged) { $stockInput.val(''); }
                dropdownSelector.disableSelector(UNIT_SELECTOR);
                break;
              default:
                break;
            }

            updateChangeAmount($('#stock-input-amount'));
          });

          $('#stock-input-amount, #low_stock_threshold').on('input focus', function() {
            let decimals = $(this).data('decimals');
            this.value = formatDecimalValue(this.value, decimals);
          });

          SmartAnnotation.init($('#repository-stock-value-comment')[0]);

          $('#repository-stock-value-comment').on('keyup change', function() {
            $(this).closest('.sci-input-container').toggleClass(
              'error',
              this.value.length > GLOBAL_CONSTANTS.NAME_MAX_LENGTH
            );
            $('.update-repository-stock').toggleClass(
              'disabled',
              this.value.length > GLOBAL_CONSTANTS.NAME_MAX_LENGTH
            );
          });

          $('#reminder-selector-checkbox').on('change', function() {
            let valueContainer = $('.repository-stock-reminder-value');
            valueContainer.toggleClass('hidden', !this.checked);
            valueContainer.find('input').attr('required', this.checked);
            if (!this.checked) {
              $(this).data('reminder-value', valueContainer.find('input').val());
              valueContainer.find('input').val(null);
            } else {
              valueContainer.find('input').val($(this).data('reminder-value'));
              valueContainer.find('input').focus();
            }
          });

          $('.update-repository-stock').on('click', function() {
            let reminderError = $('#reminder-selector-checkbox')[0].checked
                                && $('.repository-stock-reminder-value').find('input').val() === '';
            $('.repository-stock-reminder-value').find('.sci-input-container').toggleClass('error', reminderError);
          });

          $('#stock-input-amount').on('input', function() {
            amountChanged = true;
            updateChangeAmount($(this));
          });

          $manageModal.on('ajax:beforeSend', 'form', function() {
            let status = true;
            if (!(dropdownSelector.getValues(UNIT_SELECTOR) > 0)) {
              dropdownSelector.showError(UNIT_SELECTOR, I18n.t('repository_stock_values.manage_modal.unit_error'));
              status = false;
            } else {
              dropdownSelector.hideError(UNIT_SELECTOR);
            }

            if ($('#stock-input-amount').val().length) {
              $('#stock-input-amount').parent().removeClass('error');
            } else {
              $('#stock-input-amount').parent().addClass('error');
              status = false;
            }

            return status;
          });

          $manageModal.modal('show');
          $('#stock-input-amount').focus();
          $('#stock-input-amount')[0].selectionStart = $('#stock-input-amount')[0].value.length;
          $('#stock-input-amount')[0].selectionEnd = $('#stock-input-amount')[0].value.length;
        }
      });
    });
  }

  return {
    init: () => {
      initManageAction();
    }
  };
}());

RepositoryStockValues.init();
