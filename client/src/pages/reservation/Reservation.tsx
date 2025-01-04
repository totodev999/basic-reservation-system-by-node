import axios, { AxiosError } from 'axios';
import React, {
  Suspense,
  use,
  useActionState,
  useContext,
  useEffect,
  useState,
} from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useNavigate } from 'react-router';
import { Context } from '../Base';

const getReservation = async ({
  storeId,
  reservationTypeId,
}: {
  storeId: number;
  reservationTypeId: number;
}) => {
  const res = await axios.get<{
    availableSlots: {
      date: string;
      slots: string[];
    }[];
  }>(
    `/api/reservations/available?storeId=${storeId}&reservationTypeId=${reservationTypeId}`
  );
  return res.data;
};

const Reservation = () => {
  const { state } = useContext(Context)!;
  const navigate = useNavigate();
  const getReservationWithParam = () =>
    getReservation({
      storeId: state.selectedStore as number,
      reservationTypeId: state.reservationType as number,
    });
  const [invokeGetReservation, setInvokeGetReservation] = useState(() =>
    getReservationWithParam()
  );
  const refetch = () => setInvokeGetReservation(getReservationWithParam());

  useEffect(
    () => {
      if (!state.reservationType || !state.selectedStore) {
        navigate('/type');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  console.log(state);

  // in this component, rerendering never happens, so it's ok to use "use hook" like this.
  // if rerendering happens, fetching data will be called again.
  // const invokeGetReservation = getReservation({
  //   storeId: state.selectedStore as number,
  //   reservationTypeId: state.reservationType as number,
  // });
  return (
    <div className="grid place-content-center min-h-screen min-w-max">
      <h2 className="text-center text-3xl">Select your preferred date</h2>
      <div className="mt-10">
        <ErrorBoundary fallback={<div>Something went wrong</div>}>
          <Suspense fallback={<div className="text-center">Loading...</div>}>
            <ShowReservation
              invokeGetReservation={invokeGetReservation}
              refetch={refetch}
            />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
};
export const ShowReservation = ({
  invokeGetReservation,
  refetch,
}: {
  invokeGetReservation: Promise<{
    availableSlots: {
      date: string;
      slots: string[];
    }[];
  }>;
  refetch: () => void;
}) => {
  const [date, setDate] = React.useState('');
  const [time, setTime] = React.useState('');
  const data = use(invokeGetReservation);
  const { state } = useContext(Context)!;
  const [error, action, isPending] = useActionState<string | null, FormData>(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (_previousState: string | null, _formData: FormData) => {
      try {
        await axios.post('/api/reservations', {
          storeId: state.selectedStore,
          reservationTypeId: state.reservationType,
          userEmail: 'test@gmail.com',
          startTime: time,
          date: date,
        });
        return null;
      } catch (e) {
        refetch();
        if (e instanceof AxiosError) {
          return e.response?.data.error;
        }
        return 'Something went wrong';
      }
    },
    null
  );

  const slots = data.availableSlots.find((item) => item.date === date);
  const selectClass =
    'w-3/4 md:w-1/3 border-2 border-gray-500 rounded text-center text-gray-800 focus:border-blue-500 focus:outline-none';

  return (
    <div className="flex flex-col gap-2 justify-center w-screen">
      <div className="text-center">
        <label className="block mb-4" htmlFor="date">
          日付
        </label>
        <select
          id="date"
          name="date"
          className={selectClass}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        >
          <option value="" selected>
            選択してください
          </option>

          {data.availableSlots.map((item) => {
            return (
              <option
                key={item.date}
                value={item.date}
                disabled={item.slots.length === 0}
              >
                {item.date}
              </option>
            );
          })}
        </select>
      </div>

      <div className="text-center">
        {date && (
          <>
            <div>
              <label className="block mb-4" htmlFor="time">
                時間
              </label>
            </div>
            <select
              id="time"
              name="time"
              className={selectClass}
              value={time}
              onChange={(e) => setTime(e.target.value)}
            >
              <option value="" selected>
                選択してください
              </option>
              {slots?.slots.map((item) => {
                return (
                  <option key={item} value={item}>
                    {item}
                  </option>
                );
              })}
            </select>
          </>
        )}
      </div>
      <div className="mx-auto mt-4 text-center">
        <form action={action}>
          <button
            className="border-2 border-green-800 bg-green-400 w-[100px] py-2 px-1 rounded duration-200 hover:scale-110 focus:scale-110 focus:outline-none"
            disabled={isPending}
          >
            Reserve
          </button>
          <p className="mt-2 text-red-500">{error}</p>
        </form>
      </div>
    </div>
  );
};

export default Reservation;
