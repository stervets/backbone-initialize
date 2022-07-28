(function() {

  /*
      To-do application
  */
  /*
      Application layout
  */
  /*
      Global backbone initialize prepare function
  */
  /*
      To-do collection
  */
  /*
      To-do collection view
  */
  /*
      To-do item model
  */
  /*
      To-do item view
  */
  /*
      "changeLanguage" event handler
  */
  var Application, ApplicationLayout, SetTranslations, TRANSLATION, TodoCollection, TodoCollectionView, TodoItem, TodoItemView, language, setTranslations;

  language = 'en';

  TRANSLATION = {
    en: {
      todoList: 'To do list',
      deleteItem: 'Delete item',
      item: 'Item',
      addItem: 'Add item',
      changeLanguage: 'Change language'
    },
    de: {
      todoList: 'Aufgabenliste',
      deleteItem: 'Element löschen',
      item: 'Artikel',
      addItem: 'Artikel hinzufügen',
      changeLanguage: 'Sprache ändern'
    }
  };

  TodoItem = (function() {
    class TodoItem extends Backbone.Model {
      onLanguageChanged() {
        return this.set('title', `${this.translation.item} #${this.cid}`);
      }

      launch() {}

    };

    TodoItem.prototype.defaults = {
      title: '',
      checked: ''
    };

    TodoItem.prototype.translationImport = ['item'];

    return TodoItem;

  }).call(this);

  TodoCollection = (function() {
    class TodoCollection extends Backbone.Collection {};

    TodoCollection.prototype.model = TodoItem;

    return TodoCollection;

  }).call(this);

  TodoItemView = (function() {
    class TodoItemView extends Marionette.ItemView {
      deleteItem() {
        return this.model.destroy();
      }

      onItemClick() {
        return this.model.set('checked', this.model.get('checked') === 'checked' ? '' : 'checked');
      }

    };

    TodoItemView.prototype.template = '#jsTodoItemView';

    TodoItemView.prototype.ui = {
      checkbox: '.jsCheckbox',
      deleteButton: '.jsDeleteItem'
    };

    TodoItemView.prototype.translationImport = ['deleteItem'];

    TodoItemView.prototype.events = {
      'click @ui.deleteButton': 'deleteItem',
      'click @ui.jsCheckbox': 'onCheckboxClick',
      'click': 'onItemClick'
    };

    TodoItemView.prototype.handlers = {
      'model.change': 'render'
    };

    return TodoItemView;

  }).call(this);

  TodoCollectionView = (function() {
    class TodoCollectionView extends Marionette.CompositeView {
      onAddItemClick() {
        return this.collection.add({});
      }

      onChangeLanguageClick() {
        language = language === 'en' ? 'de' : 'en';
        this.collection.trigger('changeLanguage', language);
        return this.application.trigger('changeLanguage', language);
      }

    };

    TodoCollectionView.prototype.template = '#jsTodoCollectionView';

    TodoCollectionView.prototype.childView = TodoItemView;

    TodoCollectionView.prototype.childViewContainer = '.jsTodoListContainer';

    TodoCollectionView.prototype.translationImport = ['todoList', 'addItem', 'changeLanguage'];

    TodoCollectionView.prototype.ui = {
      addItem: '.jsAddItem',
      changeLanguage: '.jsChangeLanguage'
    };

    TodoCollectionView.prototype.events = {
      'click @ui.addItem': 'onAddItemClick',
      'click @ui.changeLanguage': 'onChangeLanguageClick'
    };

    return TodoCollectionView;

  }).call(this);

  ApplicationLayout = (function() {
    class ApplicationLayout extends Marionette.LayoutView {
      initializeTodoList() {
        return this.getRegion('todoList').show(new TodoCollectionView({
          attach: {
            application: this,
            collection: this.todo
          }
        }));
      }

    };

    ApplicationLayout.prototype.el = 'body';

    ApplicationLayout.prototype.regions = {
      todoList: '.jsTodoList'
    };

    ApplicationLayout.prototype.prepare = ['initializeTodoList'];

    return ApplicationLayout;

  }).call(this);

  Application = (function() {
    class Application extends Marionette.Application {
      launch() {
        return this.layout = new ApplicationLayout({
          attach: {
            application: this,
            todo: this.todo
          }
        });
      }

    };

    Application.prototype.layout = null;

    return Application;

  }).call(this);

  setTranslations = function(lang) {
    this.translation = {};
    this.translationImport.forEach((name) => {
      return this.translation[name] = TRANSLATION[lang][name];
    });
    return this.trigger('languageChanged', lang);
  };

  SetTranslations = function() {
    if (!Array.isArray(this.translationImport)) {
      return;
    }
    this.addHandler((this.application != null ? 'application.changeLanguage' : (this.collection ? 'collection.changeLanguage' : 'model.collection.changeLanguage')), setTranslations);
    if (typeof this.onLanguageChanged === 'function') {
      this.addHandler('languageChanged', 'onLanguageChanged');
    }
    setTranslations.call(this, language);
    return this.templateHelpers = () => {
      return this.translation;
    };
  };

  BackbonePrepare.push(SetTranslations);

  // init
  $(function() {
    var todo;
    todo = new TodoCollection(new Array(10));
    return new Application({
      attach: {
        todo: todo
      }
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlcyI6WyJhcHAuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7TUFBQSxXQUFBLEVBQUEsaUJBQUEsRUFBQSxlQUFBLEVBQUEsV0FBQSxFQUFBLGNBQUEsRUFBQSxrQkFBQSxFQUFBLFFBQUEsRUFBQSxZQUFBLEVBQUEsUUFBQSxFQUFBOztFQUFBLFFBQUEsR0FBVzs7RUFFWCxXQUFBLEdBQ0k7SUFBQSxFQUFBLEVBQ0k7TUFBQSxRQUFBLEVBQVUsWUFBVjtNQUNBLFVBQUEsRUFBWSxhQURaO01BRUEsSUFBQSxFQUFNLE1BRk47TUFHQSxPQUFBLEVBQVMsVUFIVDtNQUlBLGNBQUEsRUFBZ0I7SUFKaEIsQ0FESjtJQU1BLEVBQUEsRUFDSTtNQUFBLFFBQUEsRUFBVSxlQUFWO01BQ0EsVUFBQSxFQUFZLGlCQURaO01BRUEsSUFBQSxFQUFNLFNBRk47TUFHQSxPQUFBLEVBQVMsb0JBSFQ7TUFJQSxjQUFBLEVBQWdCO0lBSmhCO0VBUEo7O0VBZ0JFO0lBQU4sTUFBQSxTQUFBLFFBQXVCLFFBQVEsQ0FBQyxNQUFoQztNQU9JLGlCQUFtQixDQUFBLENBQUE7ZUFDZixJQUFDLENBQUEsR0FBRCxDQUFLLE9BQUwsRUFBYyxDQUFBLENBQUEsQ0FBRyxJQUFDLENBQUEsV0FBVyxDQUFDLElBQWhCLENBQUEsRUFBQSxDQUFBLENBQXlCLElBQUMsQ0FBQSxHQUExQixDQUFBLENBQWQ7TUFEZTs7TUFHbkIsTUFBUSxDQUFBLENBQUEsRUFBQTs7SUFWWjs7dUJBQ0ksUUFBQSxHQUNJO01BQUEsS0FBQSxFQUFPLEVBQVA7TUFDQSxPQUFBLEVBQVM7SUFEVDs7dUJBR0osaUJBQUEsR0FBbUIsQ0FBQyxNQUFEOzs7Ozs7RUFVakI7SUFBTixNQUFBLGVBQUEsUUFBNkIsUUFBUSxDQUFDLFdBQXRDLENBQUE7OzZCQUNJLEtBQUEsR0FBTzs7Ozs7O0VBS0w7SUFBTixNQUFBLGFBQUEsUUFBMkIs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bEIsZUFBQSxHQUFrQixRQUFBLENBQUEsQ0FBQTtJQUNkLEtBQWMsS0FBSyxDQUFDLE9BQU4sQ0FBYyxJQUFDLENBQUEsaUJBQWYsQ0FBZDtBQUFBLGFBQUE7O0lBRUEsSUFBQyxDQUFBLFVBQUQsQ0FBWSxDQUFJLHdCQUFILEdBQXNCLDRCQUF0QixHQUNULENBQUksSUFBQyxDQUFBLFVBQUosR0FBb0IsMkJBQXBCLEdBQXFELGlDQUF0RCxDQURRLENBQVosRUFDK0YsZUFEL0Y7SUFHQSxJQUFHLE9BQU8sSUFBQyxDQUFBLGlCQUFSLEtBQTZCLFVBQWhDO01BQ0ksSUFBQyxDQUFBLFVBQUQsQ0FBWSxpQkFBWixFQUErQixtQkFBL0IsRUFESjs7SUFHQSxlQUFlLENBQUMsSUFBaEIsQ0FBcUIsSUFBckIsRUFBd0IsUUFBeEI7V0FDQSxJQUFDLENBQUEsZUFBRCxHQUFtQixDQUFBLENBQUEsR0FBQTthQUFHLElBQUMsQ0FBQTtJQUFKO0VBVkw7O0VBWWxCLGVBQWUsQ0FBQyxJQUFoQixDQUFxQixlQUFyQixFQWxKQTs7O0VBc0pBLENBQUEsQ0FBRSxRQUFBLENBQUEsQ0FBQTtBQUNGLFFBQUE7SUFBSSxJQUFBLEdBQU8sSUFBSSxjQUFKLENBQW1CLElBQUksS0FBSixDQUFVLEVBQVYsQ0FBbkI7V0FDUCxJQUFJLFdBQUosQ0FDSTtNQUFBLE1BQUEsRUFDSTtRQUFBLElBQUEsRUFBTTtNQUFOO0lBREosQ0FESjtFQUZGLENBQUY7QUF0SkEiLCJzb3VyY2VzQ29udGVudCI6WyJsYW5ndWFnZSA9ICdlbidcblxuVFJBTlNMQVRJT04gPVxuICAgIGVuOlxuICAgICAgICB0b2RvTGlzdDogJ1RvIGRvIGxpc3QnXG4gICAgICAgIGRlbGV0ZUl0ZW06ICdEZWxldGUgaXRlbSdcbiAgICAgICAgaXRlbTogJ0l0ZW0nXG4gICAgICAgIGFkZEl0ZW06ICdBZGQgaXRlbSdcbiAgICAgICAgY2hhbmdlTGFuZ3VhZ2U6ICdDaGFuZ2UgbGFuZ3VhZ2UnXG4gICAgZGU6XG4gICAgICAgIHRvZG9MaXN0OiAnQXVmZ2FiZW5saXN0ZSdcbiAgICAgICAgZGVsZXRlSXRlbTogJ0VsZW1lbnQgbMO2c2NoZW4nXG4gICAgICAgIGl0ZW06ICdBcnRpa2VsJ1xuICAgICAgICBhZGRJdGVtOiAnQXJ0aWtlbCBoaW56dWbDvGdlbidcbiAgICAgICAgY2hhbmdlTGFuZ3VhZ2U6ICdTcHJhY2hlIMOkbmRlcm4nXG5cbiMjI1xuICAgIFRvLWRvIGl0ZW0gbW9kZWxcbiMjI1xuY2xhc3MgVG9kb0l0ZW0gZXh0ZW5kcyBCYWNrYm9uZS5Nb2RlbFxuICAgIGRlZmF1bHRzOlxuICAgICAgICB0aXRsZTogJydcbiAgICAgICAgY2hlY2tlZDogJydcblxuICAgIHRyYW5zbGF0aW9uSW1wb3J0OiBbJ2l0ZW0nXVxuXG4gICAgb25MYW5ndWFnZUNoYW5nZWQ6IC0+XG4gICAgICAgIEBzZXQgJ3RpdGxlJywgXCIje0B0cmFuc2xhdGlvbi5pdGVtfSAjI3tAY2lkfVwiXG5cbiAgICBsYXVuY2g6IC0+XG5cbiMjI1xuICAgIFRvLWRvIGNvbGxlY3Rpb25cbiMjI1xuY2xhc3MgVG9kb0NvbGxlY3Rpb24gZXh0ZW5kcyBCYWNrYm9uZS5Db2xsZWN0aW9uXG4gICAgbW9kZWw6IFRvZG9JdGVtXG5cbiMjI1xuICAgIFRvLWRvIGl0ZW0gdmlld1xuIyMjXG5jbGFzcyBUb2RvSXRlbVZpZXcgZXh0ZW5kcyBNYXJpb25ldHRlLkl0ZW1WaWV3XG4gICAgdGVtcGxhdGU6ICcjanNUb2RvSXRlbVZpZXcnXG4gICAgdWk6XG4gICAgICAgIGNoZWNrYm94OiAnLmpzQ2hlY2tib3gnXG4gICAgICAgIGRlbGV0ZUJ1dHRvbjogJy5qc0RlbGV0ZUl0ZW0nXG5cbiAgICB0cmFuc2xhdGlvbkltcG9ydDogWydkZWxldGVJdGVtJ11cblxuICAgIGV2ZW50czpcbiAgICAgICAgJ2NsaWNrIEB1aS5kZWxldGVCdXR0b24nOiAnZGVsZXRlSXRlbSdcbiAgICAgICAgJ2NsaWNrIEB1aS5qc0NoZWNrYm94JzogJ29uQ2hlY2tib3hDbGljaydcbiAgICAgICAgJ2NsaWNrJzogJ29uSXRlbUNsaWNrJ1xuXG4gICAgaGFuZGxlcnM6XG4gICAgICAgICdtb2RlbC5jaGFuZ2UnOiAncmVuZGVyJ1xuXG4gICAgZGVsZXRlSXRlbTogLT5cbiAgICAgICAgQG1vZGVsLmRlc3Ryb3koKVxuXG4gICAgb25JdGVtQ2xpY2s6IC0+XG4gICAgICAgIEBtb2RlbC5zZXQoJ2NoZWNrZWQnLCBpZiBAbW9kZWwuZ2V0KCdjaGVja2VkJykgaXMgJ2NoZWNrZWQnIHRoZW4gJycgZWxzZSAnY2hlY2tlZCcpXG5cblxuIyMjXG4gICAgVG8tZG8gY29sbGVjdGlvbiB2aWV3XG4jIyNcbmNsYXNzIFRvZG9Db2xsZWN0aW9uVmlldyBleHRlbmRzIE1hcmlvbmV0dGUuQ29tcG9zaXRlVmlld1xuICAgIHRlbXBsYXRlOiAnI2pzVG9kb0NvbGxlY3Rpb25WaWV3JyxcbiAgICBjaGlsZFZpZXc6IFRvZG9JdGVtVmlldyxcbiAgICBjaGlsZFZpZXdDb250YWluZXI6ICcuanNUb2RvTGlzdENvbnRhaW5lcidcblxuICAgIHRyYW5zbGF0aW9uSW1wb3J0OiBbJ3RvZG9MaXN0JywgJ2FkZEl0ZW0nLCAnY2hhbmdlTGFuZ3VhZ2UnXVxuXG4gICAgdWk6XG4gICAgICAgIGFkZEl0ZW06ICcuanNBZGRJdGVtJ1xuICAgICAgICBjaGFuZ2VMYW5ndWFnZTogJy5qc0NoYW5nZUxhbmd1YWdlJ1xuXG4gICAgZXZlbnRzOlxuICAgICAgICAnY2xpY2sgQHVpLmFkZEl0ZW0nOiAnb25BZGRJdGVtQ2xpY2snXG4gICAgICAgICdjbGljayBAdWkuY2hhbmdlTGFuZ3VhZ2UnOiAnb25DaGFuZ2VMYW5ndWFnZUNsaWNrJ1xuXG4gICAgb25BZGRJdGVtQ2xpY2s6IC0+XG4gICAgICAgIEBjb2xsZWN0aW9uLmFkZCB7fVxuXG4gICAgb25DaGFuZ2VMYW5ndWFnZUNsaWNrOiAtPlxuICAgICAgICBsYW5ndWFnZSA9IGlmIGxhbmd1YWdlIGlzICdlbicgdGhlbiAnZGUnIGVsc2UgJ2VuJ1xuICAgICAgICBAY29sbGVjdGlvbi50cmlnZ2VyICdjaGFuZ2VMYW5ndWFnZScsIGxhbmd1YWdlXG4gICAgICAgIEBhcHBsaWNhdGlvbi50cmlnZ2VyICdjaGFuZ2VMYW5ndWFnZScsIGxhbmd1YWdlXG5cblxuIyMjXG4gICAgQXBwbGljYXRpb24gbGF5b3V0XG4jIyNcbmNsYXNzIEFwcGxpY2F0aW9uTGF5b3V0IGV4dGVuZHMgTWFyaW9uZXR0ZS5MYXlvdXRWaWV3XG4gICAgZWw6ICdib2R5JyxcbiAgICByZWdpb25zOlxuICAgICAgICB0b2RvTGlzdDogJy5qc1RvZG9MaXN0J1xuXG4gICAgcHJlcGFyZTogW1xuICAgICAgICAnaW5pdGlhbGl6ZVRvZG9MaXN0J1xuICAgIF1cblxuICAgIGluaXRpYWxpemVUb2RvTGlzdDogLT5cbiAgICAgICAgQGdldFJlZ2lvbigndG9kb0xpc3QnKS5zaG93KFxuICAgICAgICAgICAgbmV3IFRvZG9Db2xsZWN0aW9uVmlld1xuICAgICAgICAgICAgICAgIGF0dGFjaDpcbiAgICAgICAgICAgICAgICAgICAgYXBwbGljYXRpb246IEBcbiAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbjogQHRvZG9cbiAgICAgICAgKVxuXG5cbiMjI1xuICAgIFRvLWRvIGFwcGxpY2F0aW9uXG4jIyNcbmNsYXNzIEFwcGxpY2F0aW9uIGV4dGVuZHMgTWFyaW9uZXR0ZS5BcHBsaWNhdGlvblxuICAgIGxheW91dDogbnVsbFxuICAgIGxhdW5jaDogLT5cbiAgICAgICAgQGxheW91dCA9IG5ldyBBcHBsaWNhdGlvbkxheW91dFxuICAgICAgICAgICAgYXR0YWNoOlxuICAgICAgICAgICAgICAgIGFwcGxpY2F0aW9uOiBAXG4gICAgICAgICAgICAgICAgdG9kbzogQHRvZG9cblxuIyMjXG4gICAgXCJjaGFuZ2VMYW5ndWFnZVwiIGV2ZW50IGhhbmRsZXJcbiMjI1xuc2V0VHJhbnNsYXRpb25zID0gKGxhbmcpLT5cbiAgICBAdHJhbnNsYXRpb24gPSB7fVxuICAgIEB0cmFuc2xhdGlvbkltcG9ydC5mb3JFYWNoIChuYW1lKT0+XG4gICAgICAgIEB0cmFuc2xhdGlvbltuYW1lXSA9IFRSQU5TTEFUSU9OW2xhbmddW25hbWVdXG4gICAgQHRyaWdnZXIgJ2xhbmd1YWdlQ2hhbmdlZCcsIGxhbmdcblxuIyMjXG4gICAgR2xvYmFsIGJhY2tib25lIGluaXRpYWxpemUgcHJlcGFyZSBmdW5jdGlvblxuIyMjXG5TZXRUcmFuc2xhdGlvbnMgPSAtPlxuICAgIHJldHVybiB1bmxlc3MgQXJyYXkuaXNBcnJheSBAdHJhbnNsYXRpb25JbXBvcnRcblxuICAgIEBhZGRIYW5kbGVyIChpZiBAYXBwbGljYXRpb24/IHRoZW4gJ2FwcGxpY2F0aW9uLmNoYW5nZUxhbmd1YWdlJyBlbHNlXG4gICAgICAgIChpZiBAY29sbGVjdGlvbiB0aGVuICdjb2xsZWN0aW9uLmNoYW5nZUxhbmd1YWdlJyBlbHNlICdtb2RlbC5jb2xsZWN0aW9uLmNoYW5nZUxhbmd1YWdlJykpLCBzZXRUcmFuc2xhdGlvbnNcblxuICAgIGlmIHR5cGVvZiBAb25MYW5ndWFnZUNoYW5nZWQgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgICBAYWRkSGFuZGxlciAnbGFuZ3VhZ2VDaGFuZ2VkJywgJ29uTGFuZ3VhZ2VDaGFuZ2VkJ1xuXG4gICAgc2V0VHJhbnNsYXRpb25zLmNhbGwgQCwgbGFuZ3VhZ2VcbiAgICBAdGVtcGxhdGVIZWxwZXJzID0gPT4gQHRyYW5zbGF0aW9uXG5cbkJhY2tib25lUHJlcGFyZS5wdXNoIFNldFRyYW5zbGF0aW9uc1xuXG5cbiMgaW5pdFxuJCAtPlxuICAgIHRvZG8gPSBuZXcgVG9kb0NvbGxlY3Rpb24obmV3IEFycmF5KDEwKSlcbiAgICBuZXcgQXBwbGljYXRpb25cbiAgICAgICAgYXR0YWNoOlxuICAgICAgICAgICAgdG9kbzogdG9kbyJdfQ==
