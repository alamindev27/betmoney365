$( document ).ready( function () {

    // Ajax submit form
    $( document ).on( 'submit', '[data-from="ajax"]', function ( event ) {
        event.preventDefault();

        let form = $( this );
        let url = $( this ).attr( 'action' );
        let redirect = $( this ).attr( 'data-form-redirect' )
        let data = $( this ).serialize();
        let errorContainer = $( this ).find( '.errors' );
        $( this ).find( '.errors *' ).fadeOut( 'slow' );
        let waitTime = 0;

        // If need wait
        if ( $( this ).attr( 'data-wait' ) ) {
            waitTime = $( this ).attr( 'data-wait' );
        }

        setTimeout( function () {
            $.ajax(
                {
                    url: url,
                    cache: false,
                    data: data,
                    method: 'post',
                    dataType: 'json',

                    success: function ( data, ajaxTextStatus, xhr ) {
                        if ( data.success === true && redirect ) {
                            window.location.href = redirect;
                        }
                    },
                    error: function ( xhr, ajaxTextStatus ) {

                        // Fire a custom form error event
                        let eventName = 'formHasError';
                        if ( form.attr( 'name' ) ) {
                            eventName = form.attr( 'name' ) + '-' + 'formHasError';
                        }
                        $.event.trigger( {
                            type: eventName
                        } );

                        let HTML = '';
                        $.each( xhr.responseJSON.errors, function ( key, value ) {
                            HTML += "<div class='text-danger text-xs mb-3'>" + value[0] + "</div>"
                        } );
                        errorContainer.html( HTML );
                    },
                }
            );
        }, waitTime );
    } );

    // Autofill refer username
    function getUrlParameter( sParam ) {
        let sPageURL = window.location.search.substring( 1 ),
            sURLVariables = sPageURL.split( '&' ),
            sParameterName,
            i;

        for ( i = 0; i < sURLVariables.length; i++ ) {
            sParameterName = sURLVariables[i].split( '=' );

            if ( sParameterName[0] === sParam ) {
                return sParameterName[1] === undefined ? true : decodeURIComponent( sParameterName[1] );
            }
        }
        return false;
    }

    let refer = getUrlParameter( 'refer' );
    if ( refer ) {
        $( '.autoFillRefer' ).val( refer );
    }

    // Toggle login registration modal pane
    function hideAll() {
        $( '#lrModal' ).find( '#collapseOne, #collapseTwo, #collapseThree' ).removeClass( 'show' );
    }

    $( '.activeLoginPane' ).click( function () {
        hideAll()
        $( '.collapse.login' ).addClass( 'show' );
    } );
    $( '.activeRegPane' ).click( function () {
        hideAll();
        $( '.collapse.reg' ).addClass( 'show' );
    } );

    // Prepare bet slip, on click answer
    $( 'body' ).on( 'click', ".ansewer:not(#betSlipModal .ansewer)", function () {
        let amount = $( '#amount' );
        let answer = $( this );
        let question = answer.closest( '.question' );
        let matchContainer = answer.closest( '.all-questions' );
        let match = matchContainer.find( '.match' );

        let odd = parseFloat( answer.find( '.odd' ).text() );

        $( '.placeMatch' ).replaceWith( match.html() );
        $( '.placeQuestionName' ).html( question.find( '.question-name' ).text() );
        $( '.placeAnswer' ).html( answer.html() );

        $( '#betSlipModal [name="answer"]' ).remove();
        amount.after( "<input type='hidden' name='answer' value='" + answer.attr( 'data-id' ) + "'>" );
        $( '.errors' ).empty();

        // clear previous bet amount and return
        amount.val( '' );
        $( '#returnAmount' ).html( '' );

        // Open login modal if user is not login
        if ( $( '[name="auth"]' ).attr( 'content' ) === 'false' ) {
            $( '#lrModal' ).modal( 'show' );
            hideAll()
            $( '.collapse.login' ).addClass( 'show' );
            return null;
        }

        // Don't open modal if question is suspended
        if ( question.hasClass( 'suspended' ) ) {
            return null;
        }

        // Show login modal if user not login
        $( "#betSlipModal" ).modal( 'show' );

        // Update bet return
        function updateReturn( odd ) {
            if ( typeof odd == 'number' ) {
                let betReturn = parseFloat( amount.val() ) * odd;
                $( '#returnAmount' ).html( '<small>' + amount.val() + ' x ' + odd + ' = ' + '</small>' + betReturn );
            }
        }

        // updateReturn( odd );

        $( amount ).keyup( function () {
            updateReturn( odd );
        } );

        // Bet amount suggestion
        $( '.amount-suggestion > *' ).click( function ( event ) {
            event.preventDefault();
            amount.val( $( this ).text() );
            updateReturn( odd );
        } );
    } );

    // Bet slip bet button functionality
    $( '.betNowBtn' ).click( function ( e ) {

        if ( $( '.bet-amount' ).val() ) {

            $( this ).toggle();
            $( '.betProcessingBtn' ).toggle();
        }
    } );
    $( document ).on( 'bet-formHasError', function () {

        $( '.betNowBtn' ).toggle();
        $( '.betProcessingBtn' ).toggle();
    } )


    // Infinite scroll
    $( window ).scroll( function () {
        let documentHeight = $( document ).height();
        let totalScrolled = $( window ).height() + $( window ).scrollTop();

        totalScrolled += 1500;

        //when user reach on bottom
        if ( totalScrolled >= documentHeight ) {

            //if next page link is is exist
            let next_page = $( '[data-next-page]' ).attr( 'data-next-page' )

            if ( next_page ) {

                // Never sent duplicate request before 10 second
                if ( localStorage.getItem( 'prev-request-url' ) === next_page ) {

                    // Next retry after 10 second
                    let retryTime = new Date( localStorage.getItem( 'prev-request-url-time' ) );
                    retryTime.setSeconds( retryTime.getSeconds() + 10 );

                    // Dont send request if current request time is less than next retry time, wait...
                    if ( (new Date()) < retryTime ) {
                        return null;
                    }
                }

                //prevent browser scrollbar bounce down move effect, and request jam
                // $( window ).scrollTop( totalScrolled - 5 );

                //send ajax request and put content after nextPage element
                $.get( next_page, function ( data, ajaxStatus, xhr ) {
                    $( '[data-next-page]' ).after( data );
                    $( '[data-next-page]' ).first().remove();
                }, 'html' );

                // Set requested url and time
                localStorage.setItem( 'prev-request-url', next_page );
                localStorage.setItem( 'prev-request-url-time', (new Date).toString() );

                //ajax error
                $( document ).ajaxError( function ( event, xhr, settings, thrownError ) {

                    localStorage.setItem( 'prev-ajax-url', null );
                    console.log( 'There is an infinite scroll ajax error: ' + xhr.statusText );
                } );

            }

        }

    } );


    // Auto focus input on modal show, always keep in bottom because some time old input value need to clear first
    $( document ).on( 'shown.bs.modal', '.modal', function () {
        $( this ).find( '.modal-input-focus' ).focus();
    } );

    // Default ajax error behaviour
    $( document ).ajaxError( function ( event, request, settings ) {

        localStorage.setItem( 'prev-ajax-url', null ); // for ajax infinite scroll
        console.log( 'There is an ajax error!' );
    } );

    //Nav dropdown auto show on mobile device
    function navDropdownShow() {
        $( '.nav-dropdown' ).addClass( 'show' )
    }

    function navDropdownHide() {
        $( '.nav-dropdown' ).removeClass( 'show' )
    }

    if ( $( window ).width() <= 576 ) {
        navDropdownShow();
    }

    $( window ).resize( function () {


        if ( $( window ).width() <= 576 ) {
            navDropdownShow();
        } else {
            navDropdownHide();
        }
    } );
} );
