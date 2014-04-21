/**
 * ng-context-menu - An AngularJS directive to display a context menu when a right-click event is triggered
 *
 * @author Ian Kennington Walter (http://ianvonwalter.com)
 */
angular
  .module('ng-context-menu', [])
  
  /**
   * Context menu service allows control of other context menus when another
   * one is triggered, i.e. closing any other currently open context menu 
   * when another one is opened if multiple context menus exist.
   */
  .service('contextMenu', function() {
    var menus = [],
        closeMenu,
        openMenu;

    //  {{{ contextMenu.closeMenu()

    /**
     * closeMenu() closes the given menu element.
     *
     * @param <Element> menuElement
     */
    closeMenu = function(menuElement) {
      menuElement.removeClass('open');

      // Set menuItem.isOpen to false
      menus.forEach(function(menuItem) {
        if(menuItem.element === menuElement) {
          menuItem.isOpen = false;

          // TODO: Break out of angular forEach?
        }
      });
    };

    // }}}
    // {{{ contextMenu.openMenu()

    /**
     * openMenu() opens the given menu element, triggered by the 
     * specified event.
     *
     * @param <Event> event
     * @param <Element> menuElement
     */
    openMenu = function(event, menuElement) {
      // Item that needs to be opened
      var curMenu;

      // Close all other opened menus, mark the current one
      menus.forEach(function(menuItem) {
        if(menuItem.element === menuElement) {
          curMenu = menuItem;
        } else if(menuItem.isOpen) {

          // Close other menu
          closeMenu(menuItem.element);
          menuItem.isOpen = false;
        }
      });

      if(!curMenu) {

        // Menu does not exist yet. Create menu and push onto list
        curMenu = {
          isOpen: false,
          element: menuElement
        };
        menus.push(curMenu);
      }

      if(!curMenu.isOpen) {

        // Show element
        // TODO: Fix for child element padding
        menuElement.css('top', event.offsetY + 'px');
        menuElement.css('left', event.offsetX + 'px');
        menuElement.addClass('open');
        curMenu.isOpen = true;
      }
    };

    //  }}}

    // Expose for outside service calls
    this.closeMenu = closeMenu;
    this.openMenu = openMenu;
  })
  .directive('contextMenu', ['$window', '$parse', 'contextMenu', function($window, $parse, contextMenu) {
    return {
      restrict: 'A',
      link: function($scope, element, attrs) {
        
        var disabled = $scope.$eval(attrs.contextMenuDisabled),
            win = angular.element($window),
            fn = $parse(attrs.contextMenu),
            menuElement,
            openTarget;

        element.bind('contextmenu', function(event) {
          
          if (!disabled) {
            if(menuElement === undefined) {
              menuElement = angular.element(document.getElementById(attrs.target));
            }
            openTarget = event.target;
            event.preventDefault();
            event.stopPropagation();
            $scope.$apply(function() {
              fn($scope, { $event: event });
              contextMenu.openMenu(event, menuElement);
            });
          }
        });

        win.bind('keyup', function(event) {
          if (menuElement && !disabled && event.keyCode === 27) {
            $scope.$apply(function() {
              contextMenu.closeMenu(menuElement);
            });
          }
        });

        function handleWindowClickEvent(event) {
          if (menuElement && !disabled && (event.button !== 2 || event.target !== openTarget)) {
            $scope.$apply(function() {
              contextMenu.closeMenu(menuElement);
            });
          }
        }

        // Firefox treats a right-click as a click and a contextmenu event while other browsers
        // just treat it as a contextmenu event
        win.bind('click', handleWindowClickEvent);
        win.bind('contextmenu', handleWindowClickEvent);
      }
    };
  }]);
