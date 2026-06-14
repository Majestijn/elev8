<?php

namespace App\Http\Controllers;

use App\Services\Calendar\SlotAvailability;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AvailabilityController extends Controller
{
    /**
     * Beschikbaarheid van de tijdvakken op een dag (voor de klantflow).
     * Geeft per slot-key terug of die vrij is volgens Chris' agenda.
     *
     * Valideert hier zelf en geeft JSON terug: deze route valt buiten de
     * `api/*`-scope van `shouldRenderJsonWhen` (zie bootstrap/app.php), dus een
     * doorgegooide ValidationException zou anders een web-redirect worden.
     */
    public function show(Request $request, SlotAvailability $slots): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'date' => ['required', 'date'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Kies een geldige datum.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $date = $validator->validated()['date'];
        $overview = $slots->overview($date);

        return response()->json([
            'date' => $date,
            'available' => $overview['available'],
            'suggestions' => $overview['suggestions'],
        ]);
    }
}
