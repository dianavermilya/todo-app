/*global todomvc */
'use strict';

/**
 * Services that persists and retrieves TODOs from localStorage
 */
todomvc.factory('todoStorage', function () {
        var STORAGE_ID = 'todos-angularjs';

        return {
			init: function () {
				var promise = Kinvey.init({
				    			appKey    : 'kid_eVYPuj5uEi',
								appSecret: '27a4143e743f44dca49531193101dca0'
							});
				promise.then(function(activeUser) {
					console.log("success", activeUser);
	  				// Auto-generate the active user if not defined.
	    			if(null === activeUser) {
	    				console.log("making user");
	      				return Kinvey.User.create();
					}
				}).then(null, function(error) {
			    	status.trigger('error', error);
				});
				return promise;
			},
            get: function () {
                    return JSON.parse(localStorage.getItem(STORAGE_ID) || '[]');
            },

            put: function (todos) {
                    localStorage.setItem(STORAGE_ID, JSON.stringify(todos));
            },
	        kinveyGet: function () {
				var promise = Kinvey.DataStore.find('todos', null, {
				    success: function(kinveyTodos) {
				        console.log("get todos from kinvey", kinveyTodos);
				    },
				    error: function(e) {
				    	console.log("error", e);
				    }
				});
				return promise;
			},

			kinveySave: function (initPromise, todo) {
				console.log("temp", todo);
				var p = initPromise.then( function () {
					console.log("todoStorage kinveySave function called");

					var promise = Kinvey.DataStore.save('todos', {
						_id : todo._id,
						title: todo.title,
						completed: todo.completed,
						user: todo.user
					}, {
					    success: function(response) {
					        console.log("saved todo to Kinvey", response);
					        return response;
					    }, 
					    error: function(e) {
					    	console.log(e);
					    }
					});
					return promise;
				});
				console.log("p", p);
				return p;
			},

			kinveyRemove: function (todo) {
				var promise = Kinvey.DataStore.destroy('todos', todo._id, {
				    success: function(response) {
				        console.log("kinveySave response", response);
				    },
			    	error: function(e) {
				    	console.log(e);
				    }
				});
			},

			kinveyUpdate: function (todo) {
				console.log("this is the todo we're about to toggle: ", todo);

				var promise = Kinvey.DataStore.save('todos', {
				    _id  : todo._id,
				   	title : todo.title,
				    completed: todo.completed,
				    user: todo.user
				}, {
				    success: function(response) {
				        console.log("todo toggled: ", response);
				    },
				    error: function(e){
				    	console.log ("error toggling todo: ", e);
				    }
				});
				return promise;
			},

			kinveyClearCompleted: function () {
				var query = new Kinvey.Query();
				query.equalTo('completed', true);
				var promise = Kinvey.DataStore.clean('todos', null, {
				    success: function(response) {
				        console.log("the completed tasks should have been deleted", response);
				    },
				    error: function(e) {
				    	console.log("something went wrong with the clearing", e);
				    }
				});
				return promise;
			},

		    uuid: function () {
				function s4() {
		  			return Math.floor((1 + Math.random()) * 0x10000)
		            	.toString(16)
		            	.substring(1);
				};
				function guid() {
				  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
				         s4() + '-' + s4() + s4() + s4();
				}
			return guid();
			}
        };
});