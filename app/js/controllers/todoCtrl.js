/*global todomvc, angular */
'use strict';

/**
 * The main controller for the app. The controller:
 * - retrieves and persists the model via the todoStorage service
 * - exposes the model to the template and provides event handlers
 */
todomvc.controller('TodoCtrl', function TodoCtrl($scope, $location, todoStorage, filterFilter) {
	var promise = todoStorage.init();
	$scope.todos = {};
	promise.then(function (activeUser) {
		var get = todoStorage.kinveyGet();
		get.then(function (oldtodos) {
			var todos = $scope.todos = oldtodos;
			console.log("initial todos", $scope.todos);


        $scope.newTodo = '';
        $scope.editedTodo = null;

        $scope.$watch('todos', function (newValue, oldValue) {
                $scope.remainingCount = filterFilter(todos, { completed: false }).length;
                $scope.completedCount = todos.length - $scope.remainingCount;
                $scope.allChecked = !$scope.remainingCount;
                if (newValue !== oldValue) { // This prevents unneeded calls to the local storage
                        todoStorage.put(todos);
                        console.log("watch was called. $scope.todos: ", todos);
                }
        }, true);

        if ($location.path() === '') {
                $location.path('/');
        }

        $scope.location = $location;

        $scope.$watch('location.path()', function (path) {
                $scope.statusFilter = (path === '/active') ?
                        { completed: false } : (path === '/completed') ?
                        { completed: true } : null;
        });

        $scope.addTodo = function () {
                var newTodoName = $scope.newTodo.trim();
                if (!newTodoName.length) {
                        return;
                }
                var todo = 
                	{
                		_id: todoStorage.uuid(),
                        title: newTodoName,
                        completed: false,
                        user: "John"
                	};
                console.log("about to add a todo to scope.todos", todos);
                todos.push(todo);
                console.log("added a todo to scope.todos", todos);
                console.log("todo to push", todo);
				promise = todoStorage.kinveySave(promise, todo).then (function (res) {
					todoStorage.kinveyGet().then(function (response){
						console.log("kinvey todos are at:", response);
					});
				});

                $scope.newTodo = '';
        };

        $scope.updateCompleted = function (todo) {
	        todoStorage.kinveyUpdate(todo);
        };

        $scope.editTodo = function (todo) {
                $scope.editedTodo = todo;
                // Clone the original todo to restore it on demand.
                $scope.originalTodo = angular.extend({}, todo);
        };

        $scope.doneEditing = function (todo) {
                $scope.editedTodo = null;
                todo.title = todo.title.trim();

                if (!todo.title) {
                        $scope.removeTodo(todo);
                } else {
                	todoStorage.kinveyUpdate(todo);
                }
        };

        $scope.revertEditing = function (todo) {
                todos[todos.indexOf(todo)] = $scope.originalTodo;
                $scope.doneEditing($scope.originalTodo);
        };

        $scope.changeUser = function (todo) {
        	console.log(todo);
        };

        $scope.removeTodo = function (todo) {
            todoStorage.kinveyRemove(todo);
            todos.splice(todos.indexOf(todo), 1);
        };

        $scope.clearCompletedTodos = function () {
                $scope.todos = todos = todos.filter(function (val) {
                    return !val.completed;
                });
                todoStorage.kinveyClearCompleted();
        };

        $scope.markAll = function (completed) {
                todos.forEach(function (todo) {
                        todo.completed = completed;
                        $scope.updateCompleted(todo);
                });
        };
	}); 		});
});