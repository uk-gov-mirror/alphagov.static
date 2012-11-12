describe("success event tracking", function () {

    var guideMarkup = $("<div id='content' class='test-stub'>" +
        "<a id='guide-internal-link' href='#this-is-a-test'>link</a>" +
        "<a id='guide-external-link' href='http://www.google.com/' rel='external'>link</a>" +
        "<div id='get-started'>" +
        "<a id='transaction-external-link' href='http://www.google.com/' rel='external'>link</a>" +
        "</div>" +
        "</div>");

    var articleContainer = $("<div class='article-container test-stub'><a id='transaction-link' href='#'>link</a></div>");

    beforeEach(function () {
        $('a').unbind();
        articleContainer.clone().appendTo('body');
        guideMarkup.clone().appendTo('body');
        spyOn(GOVUK, 'sendToAnalytics');
    });

    afterEach(function () {
        Alphagov.delete_cookie("successEvents");
        $(".test-stub").remove();
        $.event.trigger("smartanswerOutcome");
    });

    describe("isTheSameArtefact", function () {
        it("should support basic case", function () {
            var result = GOVUK.Analytics.isTheSameArtefact(
                "http://www.gov.uk/claim-tax/first",
                "http://www.gov.uk/claim-tax/second");

            expect(result).toBeTruthy();
        });

        it("should support coming to very same url", function () {
            var result = GOVUK.Analytics.isTheSameArtefact(
                "http://www.gov.uk/claim-tax/first",
                "http://www.gov.uk/claim-tax/first");

            expect(result).toBeTruthy();
        });

        it("should support local anchor on previous url", function () {
            var result = GOVUK.Analytics.isTheSameArtefact(
                "http://www.gov.uk/claim-tax",
                "http://www.gov.uk/claim-tax#foobar");

            expect(result).toBeTruthy();
        });

        it("should support local anchor on current url", function () {
            var result = GOVUK.Analytics.isTheSameArtefact(
                "http://www.gov.uk/claim-tax#foobar",
                "http://www.gov.uk/claim-tax");

            expect(result).toBeTruthy();
        });
    });

    describe("isRootArtefact", function () {
        it("should be true for standard artefact url", function () {
            var result = GOVUK.Analytics.isRootOfArtefact("http://smartanswers.dev.gov.uk/student-finance-calculator");

            expect(result).toBeTruthy();
        });

        it("should be true for standard artefact url ending with a slash", function () {
            var result = GOVUK.Analytics.isRootOfArtefact("http://smartanswers.dev.gov.uk/student-finance-calculator/");

            expect(result).toBeTruthy();
        });

        it("should be false for non-root artefact url", function () {
            var result = GOVUK.Analytics.isRootOfArtefact("http://smartanswers.dev.gov.uk/student-finance-calculator/y");

            expect(result).toBeFalsy();
        });
    });

    describe("getSlug", function() {
        it("should return the slug from a url", function() {
           var result = GOVUK.Analytics.getSlug("http://www.gov.uk/student-finance-calculator");

           expect(result).toEqual("student-finance-calculator");
        });

        it("should return slug even if there is a fragment", function() {
            var result = GOVUK.Analytics.getSlug("http://www.gov.uk/student-finance-calculator#foobar");

            expect(result).toEqual("student-finance-calculator");
        });

        it("should return slug even if there is more of the request path", function() {
            var result = GOVUK.Analytics.getSlug("http://www.gov.uk/student-finance-calculator/foobar");

            expect(result).toEqual("student-finance-calculator");
        });

        it("should return slug even if there is a query string", function() {
            var result = GOVUK.Analytics.getSlug("http://www.gov.uk/student-finance-calculator?foobar=barfoo");

            expect(result).toEqual("student-finance-calculator");
        });
    });

    describe("analytics integration", function () {
        it("should register entry event", function () {
            GOVUK.Analytics.Format = 'guide';
            GOVUK.Analytics.NeedID = '99999';
            GOVUK.Analytics.startAnalytics();

            var arguments = GOVUK.sendToAnalytics.argsForCall;
            var expectedDataToSendToGoogle = ['_trackEvent', 'MS_guide', '', 'Entry'];
            expect(arguments.length).toBe(1);
            // using JSONEquals because there is a bug in the .toHaveBeenCalledWith() method
            // see: https://github.com/pivotal/jasmine/issues/45
            expect(arguments[0][0]).toBeEqualAsJSON(expectedDataToSendToGoogle);
        });

        it("should not register an entry event if there is no need id", function () {
            GOVUK.Analytics.Format = 'guide';
            GOVUK.Analytics.NeedID = undefined;
            GOVUK.Analytics.startAnalytics();

            var arguments = GOVUK.sendToAnalytics.argsForCall;
            expect(arguments.length).toBe(0);
        });

        it("should only call guide strategy when format is guide", function () {
            GOVUK.Analytics.Format = 'guide';
            GOVUK.Analytics.NeedID = '99999';
            spyOn(GOVUK.Analytics.Trackers, 'guide');
            spyOn(GOVUK.Analytics.Trackers, 'transaction');

            GOVUK.Analytics.startAnalytics();

            expect(GOVUK.Analytics.Trackers.transaction).not.toHaveBeenCalled();
            expect(GOVUK.Analytics.Trackers.guide).toHaveBeenCalled();
        });

        it("should only call transaction strategy when format is transaction", function () {
            GOVUK.Analytics.Format = 'transaction';
            GOVUK.Analytics.NeedID = '99999';
            spyOn(GOVUK.Analytics.Trackers, 'guide');
            spyOn(GOVUK.Analytics.Trackers, 'transaction');

            GOVUK.Analytics.startAnalytics();

            expect(GOVUK.Analytics.Trackers.transaction).toHaveBeenCalled();
            expect(GOVUK.Analytics.Trackers.guide).not.toHaveBeenCalled();
        });

        it("should not error if format is not supported", function () {
            GOVUK.Analytics.Format = 'blahblah';
            GOVUK.Analytics.NeedID = '99999';

            GOVUK.Analytics.startAnalytics();
        });
    });

    describe("user interactions", function () {
        it("should register success event for guide format when an internal link inside #content receives a 'return' key press", function () {
            GOVUK.Analytics.Format = 'guide';
            GOVUK.Analytics.NeedID = '99999';
            GOVUK.Analytics.startAnalytics();

            var e = jQuery.Event("keydown");
            e.which = 13;
            e.keyCode = 13;
            $("#guide-internal-link").trigger(e);

            var arguments = GOVUK.sendToAnalytics.argsForCall;
            expect(arguments.length).toBe(2);
            expect(arguments[1][0]).toBeEqualAsJSON(['_trackEvent', 'MS_guide', '', 'Success']);
        });

        it("should register success event for guide format when an internal link inside #content is clicked", function () {
            GOVUK.Analytics.Format = 'guide';
            GOVUK.Analytics.NeedID = '99999';
            GOVUK.Analytics.startAnalytics();

            $('#guide-internal-link').click();

            var arguments = GOVUK.sendToAnalytics.argsForCall;
            expect(arguments.length).toBe(2);
            expect(arguments[1][0]).toBeEqualAsJSON(['_trackEvent', 'MS_guide', '', 'Success']);
        });

        it("should not register multiple guide success events when navigating to items on the same page", function () {
            GOVUK.Analytics.Format = 'guide';
            GOVUK.Analytics.NeedID = '99999';
            GOVUK.Analytics.startAnalytics();

            $('#guide-internal-link').click();
            $('#guide-internal-link').click();
            $('#guide-internal-link').click();
            $('#guide-internal-link').click();

            var arguments = GOVUK.sendToAnalytics.argsForCall;
            expect(arguments.length).toBe(2);
            expect(arguments[1][0]).toBeEqualAsJSON(['_trackEvent', 'MS_guide', '', 'Success']);
        });

        it("should not register external click if internal link has been clicked", function () {
            GOVUK.Analytics.Format = 'guide';
            GOVUK.Analytics.NeedID = '99999';
            GOVUK.Analytics.startAnalytics();

            $('#guide-internal-link').click();
            $('#guide-external-link').click();

            var href = $("#guide-external-link").prop("href");
                expect(href).toEqual("http://www.google.com/");
        });

        it("should not register internal click if external link has been clicked", function () {
            GOVUK.Analytics.Format = 'guide';
            GOVUK.Analytics.NeedID = '99999';
            GOVUK.Analytics.startAnalytics();

            $('#guide-external-link').click();
            $('#guide-internal-link').click();

            expect(Alphagov.read_cookie("successEvents")).toBe(null);
        });

        it("should register a smart answer success if the smartanswerOutcome event is fired", function () {
            GOVUK.Analytics.Format = 'smart_answer';
            GOVUK.Analytics.NeedID = '99999';
            spyOn(GOVUK.Analytics.Trackers.smart_answer, 'shouldTrackSuccess').andReturn(true);
            GOVUK.Analytics.startAnalytics();

            $.event.trigger("smartanswerOutcome");

            var arguments = GOVUK.sendToAnalytics.argsForCall;
            expect(arguments.length).toBe(1);
            expect(arguments[0][0]).toBeEqualAsJSON(['_trackEvent', 'MS_smart_answer', '', 'Success']);
        });

        it("should not register a smart answer success if a smartanswerOutcome event has already been fired", function () {
            GOVUK.Analytics.Format = 'smart_answer';
            GOVUK.Analytics.NeedID = '99999';
            spyOn(GOVUK.Analytics.Trackers.smart_answer, 'shouldTrackSuccess').andReturn(true);
            GOVUK.Analytics.startAnalytics();

            $.event.trigger("smartanswerOutcome");
            $.event.trigger("smartanswerOutcome");

            var arguments = GOVUK.sendToAnalytics.argsForCall;
            expect(arguments.length).toBe(1);
            expect(arguments[0][0]).toBeEqualAsJSON(['_trackEvent', 'MS_smart_answer', '', 'Success']);
        });

        it("should register custom condition for entry and success tracking for smart answers", function () {
            GOVUK.Analytics.Format = 'smart_answer';
            GOVUK.Analytics.NeedID = '99999';
            spyOn(GOVUK.Analytics.Trackers.smart_answer, 'shouldTrackEntry');
            spyOn(GOVUK.Analytics.Trackers.smart_answer, 'shouldTrackSuccess');

            GOVUK.Analytics.startAnalytics();

            expect(GOVUK.Analytics.Trackers.smart_answer.shouldTrackEntry).toHaveBeenCalled();
            expect(GOVUK.Analytics.Trackers.smart_answer.shouldTrackSuccess).toHaveBeenCalled();
        });

        it("should track clicks on the get started link for transactions", function() {
            GOVUK.Analytics.Format = "transaction";
            GOVUK.Analytics.NeedID = "99999";
            GOVUK.Analytics.startAnalytics();

            $('#transaction-external-link').click();

            var href = $("#transaction-external-link").prop("href");
            var parts = href.split("/");
            var expected = "exit?slug=&need_id=99999&format=transaction";
            expect(parts[3]).toEqual(expected)
        });
    });

    describe("Success tracking for inside gov. policy format", function () {
        var policyMarkup = $("<div id='page' class='policy-stub'>" +
            "<a id='policy-in-page-link' href='#foo'></a>" +
            "<a id='policy-internal-link' href='/foobar'></a>" +
            "</div>");

        beforeEach(function () {
            policyMarkup.clone().appendTo('body');
        });

        afterEach(function () {
            $('.policy-stub').remove();
        });

        it("should register a success event for internal (GOV.UK) links", function () {
            GOVUK.Analytics.Format = 'policy';
            GOVUK.Analytics.NeedID = '-1';
            GOVUK.Analytics.startAnalytics();

            spyOn(GOVUK.Analytics.internalSiteEvents, 'push');

            $('#policy-internal-link').click();

            expect(GOVUK.Analytics.internalSiteEvents.push).toHaveBeenCalled();
        });

        it("should not register a success event for in-page links", function () {
            GOVUK.Analytics.Format = 'policy';
            GOVUK.Analytics.NeedID = '-1';
            GOVUK.Analytics.startAnalytics();

            $('#policy-in-page-link').click();
            var arguments = GOVUK.sendToAnalytics.argsForCall;

            // should only get entry event, not success.
            expect(arguments.length).toBe(1);
            expect(arguments[0][0][3]).toBe('Entry')
            expect(arguments[0][0][1]).toBe('MS_policy')
        });


    });
});