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
    var menus = [];
    // Expose for outside service calls
    this.openMenu = openMenu;
    this.closeMenu = closeMenu; 
    // References for private service calls (allow openMenu to call closeMenu)
    var svc = {
      openMenu: openMenu,
      closeMenu: closeMenu
    };

    // {{{ contextMenu.openMenu()

    function openMenu(event, menuElement) {
      // Item that needs to be opened
      var curMenuItem;
      // Close all other opened menus, mark the current one
      menus.forEach(function(menuItem) {
        if(menuItem.element === menuElement) {
          curMenuItem = menuItem;
        } else if(menuItem.isOpen) {
          // Close other menu
          svc.closeMenu(menuItem.element);
          menuItem.isOpen = false;
        }
      });

      // Menu item not yet found, doesn't exist yet
      if(!curMenuItem) {
        // Create new current menu item, push onto list of menu items
        curMenuItem = {
          isOpen: false,
          element: menuElement
        }
        menus.push(curMenuItem);
        menuElement.css('position', 'absolute');
      }

      // Show element
      menuElement.addClass('open');
      menuElement.css('top', event.offsetY + 'px');
      menuElement.css('left', event.offsetX + 'px');
      curMenuItem.isOpen = true;
    }

    //  }}}
    //  {{{ contextMenu.closeMenu()

    function closeMenu(menuElement) {
      menuElement.removeClass('open');
      // Set menuItem.isOpen to false
      menus.forEach(function(menuItem) {
        if(menuItem.element === menuElement) {
          menuItem.isOpen = false;
        }
      });
    }

    //  }}}
  })
  .directive('contextMenu', ['$window', '$parse', 'contextMenu', function($window, $parse, contextMenu) {
    return {
      restrict: 'A',
      link: function($scope, element, attrs) {
        
        var menuElement = null,
            openTarget, 
            disabled = $scope.$eval(attrs.contextMenuDisabled),
            win = angular.element($window),
            fn = $parse(attrs.contextMenu);

        element.bind('contextmenu', function(event) {
          if (!disabled) {
            if(menuElement == null){
              menuElement = angular.element(document.getElementById(attrs.target));
              menuElement.css('position', 'absolute');
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