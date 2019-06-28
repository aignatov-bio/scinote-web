/* global TinyMCE, ChemicalizeMarvinJs, MarvinJSUtil, I18n, FilePreviewModal, tinymce */
/* eslint-disable no-param-reassign */
/* eslint-disable wrap-iife */
/* eslint-disable no-use-before-define */
var marvinJsRemoteLastMrv;
var marvinJsRemoteEditor;
var MarvinJsEditor;

MarvinJsEditor = (function() {
  var marvinJsModal = $('#MarvinJsModal');
  var marvinJsContainer = $('#marvinjs-editor');
  var marvinJsObject = $('#marvinjs-sketch');
  var emptySketch = '<cml><MDocument></MDocument></cml>';
  var sketchName = marvinJsModal.find('.file-name input');
  var marvinJsMode = marvinJsContainer.data('marvinjsMode');

  // Facade api actions

  var marvinJsExport = (childFunction, options = {}) => {
    if (marvinJsMode === 'remote') {
      remoteExport(childFunction, options);
    } else {
      localExport(childFunction, options);
    }
  };

  var marvinJsImage = (childFunction, source, options = {}) => {
    if (marvinJsMode === 'remote') {
      remoteImage(childFunction, source, options);
    } else {
      localImage(childFunction, source, options);
    }
  };

  var marvinJsExportImage = (childFuction, options = {}) => {
    if (marvinJsMode === 'remote') {
      remoteExportImage(childFuction, options);
    } else {
      localExportImage(childFuction, options);
    }
  };
  // ///////////////

  var loadEditor = () => {
    if (marvinJsMode === 'remote') {
      return marvinJsRemoteEditor;
    }
    return MarvinJSUtil.getEditor('#marvinjs-sketch');
  };
  var loadPackages = () => {
    return MarvinJSUtil.getPackage('#marvinjs-sketch');
  };

  // Local marvinJS installation

  var localExport = (childFuction, options = {}) => {
    loadEditor().then(function(sketcherInstance) {
      sketcherInstance.exportStructure('mrv').then(function(source) {
        childFuction(source, options);
      });
    });
  };

  var localImage = (childFuction, source, options = {}) => {
    loadPackages().then(function(sketcherInstance) {
      sketcherInstance.onReady(function() {
        var exporter = createExporter(sketcherInstance, 'image/jpeg');
        exporter.render(source).then(function(image) {
          childFuction(source, image, options);
        });
      });
    });
  };

  var localExportImage = (childFuction, options = {}) => {
    loadEditor().then(function(sketcherInstance) {
      sketcherInstance.exportStructure('mrv').then(function(source) {
        loadPackages().then(function(sketcherPackage) {
          sketcherPackage.onReady(function() {
            var exporter = createExporter(sketcherPackage, 'image/jpeg');
            exporter.render(source).then(function(image) {
              childFuction(source, image, options);
            });
          });
        });
      });
    });
  };

  // Web services installation

  var remoteExport = (childFuction, options = {}) => {
    childFuction(marvinJsRemoteLastMrv, options);
  };

  var remoteImage = (childFuction, source, options = {}) => {
    var params = {
      carbonLabelVisible: false,
      implicitHydrogen: 'TERMINAL_AND_HETERO',
      displayMode: 'WIREFRAME',
      width: 900,
      height: 900
    };
    if (typeof (marvinJsRemoteEditor) === 'undefined') {
      setTimeout(() => { remoteImage(childFuction, source, options); }, 100);
      return false;
    }
    marvinJsRemoteEditor.exportMrvToImageDataUri(source, 'jpeg', params).then(function(image) {
      childFuction(source, image, options);
    });
    return true;
  };

  var remoteExportImage = (childFuction, options = {}) => {
    remoteImage(childFuction, marvinJsRemoteLastMrv, options);
  };

  // Support actions
  function preloadActions(config) {
    if (marvinJsMode === 'remote') {
      if (config.mode === 'new' || config.mode === 'new-tinymce') {
        marvinJsRemoteEditor.importStructure('mrv', emptySketch);
        sketchName.val(I18n.t('marvinjs.new_sketch'));
      } else if (config.mode === 'edit') {
        marvinJsRemoteEditor.importStructure('mrv', config.data);
        sketchName.val(config.name);
      } else if (config.mode === 'edit-tinymce') {
        $.get(config.marvinUrl, function(result) {
          marvinJsRemoteEditor.importStructure('mrv', result.description);
          sketchName.val(result.name);
        });
      }

      marvinJsRemoteEditor.on('molchange', () => {
        marvinJsRemoteEditor.exportStructure('mrv').then(function(source) {
          marvinJsRemoteLastMrv = source;
        });
      });
    } else {
      loadEditor().then(function(marvin) {
        if (config.mode === 'new' || config.mode === 'new-tinymce') {
          marvin.importStructure('mrv', emptySketch);
          sketchName.val(I18n.t('marvinjs.new_sketch'));
        } else if (config.mode === 'edit') {
          marvin.importStructure('mrv', config.data);
          sketchName.val(config.name);
        } else if (config.mode === 'edit-tinymce') {
          $.get(config.marvinUrl, function(result) {
            marvin.importStructure('mrv', result.description);
            sketchName.val(result.name);
          });
        }
      });
    }
  }

  function createExporter(marvin, imageType) {
    var inputFormat = 'mrv';
    var settings = {
      width: 900,
      height: 900
    };

    var params = {
      imageType: imageType,
      settings: settings,
      inputFormat: inputFormat
    };
    return new marvin.ImageExporter(params);
  }

  function assignImage(source, data, target) {
    target.attr('src', data);
    return data;
  }

  function TinyMceBuildHTML(json) {
    var imgstr = "<img src='" + json.image.url + "'";
    imgstr += " data-mce-token='" + json.image.token + "'";
    imgstr += " data-source-id='" + json.image.source_id + "'";
    imgstr += " data-source-type='" + json.image.source_type + "'";
    imgstr += " alt='description-" + json.image.token + "' />";
    return imgstr;
  }

  function saveFunction(source, config) {
    $.post(config.marvinUrl, {
      description: source,
      object_id: config.objectId,
      object_type: config.objectType,
      name: sketchName.val()
    }, function(result) {
      var newAsset;
      if (config.objectType === 'Step') {
        newAsset = $(result.html);
        newAsset.find('.file-preview-link').css('top', '-300px');
        newAsset.addClass('new').prependTo($(config.container));
        setTimeout(function() {
          newAsset.find('.file-preview-link').css('top', '0px');
        }, 200);
        FilePreviewModal.init();
      }
      $(marvinJsModal).modal('hide');
    });
  }

  function saveTinymceFunction(source, image, config) {
    $.post(config.marvinUrl, {
      description: source,
      object_id: config.objectId,
      object_type: config.objectType,
      name: sketchName.val(),
      image: image
    }, function(result) {
      var json = tinymce.util.JSON.parse(result);
      config.editor.execCommand('mceInsertContent', false, TinyMceBuildHTML(json));
      TinyMCE.updateImages(config.editor);
      $(marvinJsModal).modal('hide');
    });
  }

  function updateFunction(source, config) {
    $.ajax({
      url: config.marvinUrl,
      data: {
        description: source,
        name: sketchName.val()
      },
      dataType: 'json',
      type: 'PUT',
      success: function(json) {
        $(marvinJsModal).modal('hide');
        config.reloadImage.src.val(json.description);
        $(config.reloadImage.sketch).find('.attachment-label').text(json.name);
        MarvinJsEditor.create_preview(
          config.reloadImage.src,
          $(config.reloadImage.sketch).find('img')
        );
      }
    });
  }

  function updateTinymceFunction(source, image, config) {
    $.ajax({
      url: config.marvinUrl,
      data: {
        description: source,
        name: sketchName.val(),
        object_type: 'TinyMceAsset',
        image: image
      },
      dataType: 'json',
      type: 'PUT',
      success: function(json) {
        config.image[0].src = json.url;
        $(marvinJsModal).modal('hide');
      }
    });
  }

  // MarvinJS Methods

  return {
    enabled: function() {
      return ($('#MarvinJsModal').length > 0);
    },

    open: function(config) {
      if (!MarvinJsEditor.enabled()) {
        $('#MarvinJsPromoModal').modal('show');
        return false;
      }

      if (marvinJsMode === 'remote' && typeof (marvinJsRemoteEditor) === 'undefined') {
        setTimeout(() => { MarvinJsEditor.open(config); }, 100);
        return false;
      }
      preloadActions(config);
      $(marvinJsModal).modal('show');
      $(marvinJsObject)
        .css('width', marvinJsContainer.width() + 'px')
        .css('height', marvinJsContainer.height() + 'px');
      marvinJsModal.find('.file-save-link').off('click').on('click', () => {
        if (config.mode === 'new') {
          MarvinJsEditor.save(config);
        } else if (config.mode === 'edit') {
          MarvinJsEditor.update(config);
        } else if (config.mode === 'new-tinymce') {
          config.objectType = 'TinyMceAsset';
          MarvinJsEditor.save_with_image(config);
        } else if (config.mode === 'edit-tinymce') {
          MarvinJsEditor.update_tinymce(config);
        }
      });
      return true;
    },

    initNewButton: function(selector) {
      $(selector).off('click').on('click', function() {
        var objectId = this.dataset.objectId;
        var objectType = this.dataset.objectType;
        var marvinUrl = this.dataset.marvinUrl;
        var container = this.dataset.sketchContainer;
        MarvinJsEditor.open({
          mode: 'new',
          objectId: objectId,
          objectType: objectType,
          marvinUrl: marvinUrl,
          container: container
        });
      });
    },

    save: function(config) {
      marvinJsExport(saveFunction, config);
    },

    save_with_image: function(config) {
      marvinJsExportImage(saveTinymceFunction, config);
    },

    update: function(config) {
      marvinJsExport(updateFunction, config);
    },

    update_tinymce: function(config) {
      marvinJsExportImage(updateTinymceFunction, config);
    },

    create_preview: function(source, target) {
      marvinJsImage(assignImage, source.val(), target);
    },

    create_download_link: function(source, link, filename) {
      var downloadLink = (mrv, image, option) => {
        option.link.attr('href', image);
        option.link.attr('download', option.filename);
      };
      marvinJsImage(downloadLink, source.val(), { link: link, filename: filename });
    },

    delete_sketch: function(url, object) {
      $.ajax({
        url: url,
        dataType: 'json',
        type: 'DELETE',
        success: function() {
          $(object).remove();
        }
      });
    }
  };
});

// TinyMCE plugin

(function() {
  'use strict';

  tinymce.PluginManager.requireLangPack('MarvinJsPlugin');

  tinymce.create('tinymce.plugins.MarvinJsPlugin', {
    MarvinJsPlugin: function(ed) {
      var editor = ed;

      function openMarvinJs() {
        MarvinJsEditor.open({
          mode: 'new-tinymce',
          marvinUrl: '/marvin_js_assets',
          editor: editor
        });
      }
      // Add a button that opens a window
      editor.addButton('marvinjsplugin', {
        tooltip: I18n.t('marvinjs.new_button'),
        icon: 'file-invoice',
        onclick: openMarvinJs
      });

      // Adds a menu item to the tools menu
      editor.addMenuItem('marvinjsplugin', {
        text: I18n.t('marvinjs.new_button'),
        icon: 'file-invoice',
        context: 'insert',
        onclick: openMarvinJs
      });
    }
  });

  tinymce.PluginManager.add(
    'marvinjsplugin',
    tinymce.plugins.MarvinJsPlugin
  );
})();

// Initialization


$(document).on('turbolinks:load', function() {
  MarvinJsEditor = MarvinJsEditor();
  if (MarvinJsEditor.enabled()) {
    if ($('#marvinjs-editor')[0].dataset.marvinjsMode === 'remote') {
      ChemicalizeMarvinJs.createEditor('#marvinjs-sketch').then(function(marvin) {
        marvinJsRemoteEditor = marvin;
      });
    }
  }
  MarvinJsEditor.initNewButton('.new-marvinjs-upload-button');
});
